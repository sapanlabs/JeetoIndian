import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WinnerService {
  constructor(private prisma: PrismaService) {}

  async generateProvisionalWinners(competitionId: string) {
    const competition = await this.prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        prizes: {
          include: { prize: true },
          orderBy: { rankStart: 'asc' },
        },
      },
    });

    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    // Top valid attempt sorting
    const topAttempts = await this.prisma.quizAttempt.findMany({
      where: {
        competitionId,
        status: 'SUBMITTED',
        riskLevel: { in: ['NORMAL', 'SUSPICIOUS'] },
      },
      orderBy: [
        { score: 'desc' },
        { totalTimeMs: 'asc' },
        { submittedAt: 'asc' },
      ],
      take: 100, // Top 100 provisional positions
    });

    const winnersData = topAttempts.map((attempt, index) => {
      const rank = index + 1;
      const prizeTier = competition.prizes.find(
        (p) => rank >= p.rankStart && rank <= p.rankEnd,
      );

      return {
        competitionId,
        userId: attempt.userId,
        attemptId: attempt.id,
        rank,
        score: attempt.score,
        totalTimeMs: attempt.totalTimeMs,
        prizeId: prizeTier?.prizeId,
        isVerified: false,
      };
    });

    // Save provisional winners idempotently
    await this.prisma.winner.deleteMany({ where: { competitionId } });
    await this.prisma.winner.createMany({ data: winnersData });

    await this.prisma.competition.update({
      where: { id: competitionId },
      data: { status: 'WINNER_VERIFICATION' },
    });

    return this.getWinners(competitionId);
  }

  async verifyAndConfirmWinners(competitionId: string, adminUserId: string) {
    const competition = await this.prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    if (competition.status !== 'WINNER_VERIFICATION') {
      throw new BadRequestException('Competition is not in WINNER_VERIFICATION state');
    }

    const winners = await this.prisma.winner.findMany({
      where: { competitionId },
    });

    // Mark as verified and generate PrizeFulfillment records
    await this.prisma.$transaction(async (tx) => {
      await tx.winner.updateMany({
        where: { competitionId },
        data: {
          isVerified: true,
          verifiedBy: adminUserId,
          verifiedAt: new Date(),
        },
      });

      // Create fulfillment records for winners with prizes
      for (const winner of winners) {
        if (winner.prizeId) {
          await tx.prizeFulfillment.upsert({
            where: { winnerId: winner.id },
            update: { status: 'VERIFIED' },
            create: {
              winnerId: winner.id,
              prizeId: winner.prizeId,
              status: 'VERIFIED',
            },
          });
        }
      }

      await tx.competition.update({
        where: { id: competitionId },
        data: { status: 'COMPLETED' },
      });
    });

    return this.getWinners(competitionId);
  }

  async getWinners(competitionId: string) {
    return this.prisma.winner.findMany({
      where: { competitionId },
      orderBy: { rank: 'asc' },
      include: {
        user: { include: { profile: true } },
        prize: true,
        fulfillment: true,
      },
    });
  }
}
