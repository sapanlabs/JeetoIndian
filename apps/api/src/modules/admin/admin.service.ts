import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      activeCompetitions,
      completedAttempts,
      pendingWinnerApprovals,
      unresolvedFraudFlags,
      activeSponsors,
      activeCampaigns,
    ] = await Promise.all([
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.competition.count({ where: { status: 'LIVE' } }),
      this.prisma.quizAttempt.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.competition.count({ where: { status: 'WINNER_VERIFICATION' } }),
      this.prisma.fraudFlag.count({ where: { reviews: { none: {} } } }),
      this.prisma.sponsor.count({ where: { isActive: true } }),
      this.prisma.campaign.count({ where: { isActive: true } }),
    ]);

    return {
      totalUsers,
      activeCompetitions,
      completedAttempts,
      pendingWinnerApprovals,
      unresolvedFraudFlags,
      activeSponsors,
      activeCampaigns,
      systemHealth: 'HEALTHY',
    };
  }
}
