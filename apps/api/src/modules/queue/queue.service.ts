import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

export interface JobState {
  jobId: string;
  competitionId: string;
  queueName: 'result-processing' | 'fraud-processing' | 'notification-processing';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  attemptsMade: number;
  maxRetries: number;
  startedAt: string;
  completedAt?: string | null;
  failureReason?: string | null;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly SMALL_COMPETITION_THRESHOLD = 5000;

  constructor(private redis: RedisService) {}

  shouldUseBackgroundQueue(participantCount: number): boolean {
    return participantCount >= this.SMALL_COMPETITION_THRESHOLD;
  }

  async createJobState(competitionId: string, queueName: JobState['queueName']): Promise<JobState> {
    const jobId = `job_${queueName}_${competitionId}`;
    const key = `job_state:${jobId}`;

    const existing = await this.redis.get(key);
    if (existing) {
      return JSON.parse(existing);
    }

    const state: JobState = {
      jobId,
      competitionId,
      queueName,
      status: 'PENDING',
      attemptsMade: 0,
      maxRetries: 3,
      startedAt: new Date().toISOString(),
      completedAt: null,
      failureReason: null,
    };

    await this.redis.set(key, JSON.stringify(state), 86400 * 7); // 7-day job state retention
    return state;
  }

  async updateJobState(jobId: string, update: Partial<JobState>) {
    const key = `job_state:${jobId}`;
    const existingStr = await this.redis.get(key);
    if (!existingStr) return null;

    const existing: JobState = JSON.parse(existingStr);
    const updated: JobState = { ...existing, ...update };

    if (update.status === 'COMPLETED' || update.status === 'FAILED') {
      updated.completedAt = new Date().toISOString();
    }

    await this.redis.set(key, JSON.stringify(updated), 86400 * 7);
    this.logger.log(`Job ${jobId} updated status to ${updated.status}`);
    return updated;
  }

  async getJobState(jobId: string): Promise<JobState | null> {
    const data = await this.redis.get(`job_state:${jobId}`);
    return data ? JSON.parse(data) : null;
  }
}
