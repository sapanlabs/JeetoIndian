import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getCompetitionLeaderboard(competitionId: string, limit = 50, page = 1) {
    const skip = (page - 1) * limit;

    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        competitionId,
        status: 'SUBMITTED',
        riskLevel: { in: ['NORMAL', 'SUSPICIOUS'] }, // Exclude disqualified from public leaderboards
      },
      orderBy: [
        { score: 'desc' },
        { totalTimeMs: 'asc' },
        { submittedAt: 'asc' },
      ],
      take: limit,
      skip,
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    const totalCount = await this.prisma.quizAttempt.count({
      where: {
        competitionId,
        status: 'SUBMITTED',
        riskLevel: { in: ['NORMAL', 'SUSPICIOUS'] },
      },
    });

    return {
      entries: attempts.map((attempt, index) => ({
        rank: skip + index + 1,
        userId: attempt.userId,
        displayName: attempt.user.profile?.displayName || 'Anonymous Player',
        avatarUrl: attempt.user.profile?.avatarUrl,
        score: attempt.score,
        totalTimeMs: attempt.totalTimeMs,
        submittedAt: attempt.submittedAt?.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}
