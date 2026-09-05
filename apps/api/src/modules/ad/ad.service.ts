import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

export interface LogAdEventDto {
  competitionId: string;
  eventType: 'IMPRESSION' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  providerName?: string;
  errorMessage?: string;
}

@Injectable()
export class AdService {
  constructor(private redis: RedisService) {}

  /**
   * Enforces at most 1 ad opportunity per user per competition join attempt.
   */
  async checkAdOpportunity(userId: string, competitionId: string): Promise<{ canShowAd: boolean; placementId: string }> {
    const key = `ad_opportunity:${competitionId}:${userId}`;
    const alreadyShown = await this.redis.get(key);

    if (alreadyShown) {
      return { canShowAd: false, placementId: 'none' };
    }

    // Record ad opportunity with 24-hour TTL
    await this.redis.set(key, '1', 86400);

    return {
      canShowAd: true,
      placementId: `comp_join_${competitionId}`,
    };
  }

  /**
   * Asynchronously records ad telemetry events without blocking user gameplay.
   */
  async logAdEvent(userId: string, dto: LogAdEventDto) {
    const logKey = `ad_log:${dto.competitionId}:${Date.now()}`;
    await this.redis.set(
      logKey,
      JSON.stringify({
        userId,
        competitionId: dto.competitionId,
        eventType: dto.eventType,
        providerName: dto.providerName || 'default_admob',
        errorMessage: dto.errorMessage,
        timestamp: new Date().toISOString(),
      }),
      604800, // 7-day retention for ad revenue reconciliation
    );

    return { success: true, logged: true };
  }
}
