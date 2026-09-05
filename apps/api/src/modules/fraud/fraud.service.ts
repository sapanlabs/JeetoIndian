import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FraudService {
  constructor(private prisma: PrismaService) {}

  async listFlags(ruleTriggered?: string) {
    return this.prisma.fraudFlag.findMany({
      where: ruleTriggered ? { ruleTriggered } : undefined,
      include: {
        attempt: { include: { competition: true } },
        user: { include: { profile: true } },
        reviews: { include: { reviewer: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewFlag(flagId: string, reviewerId: string, actionTaken: 'CLEARED' | 'DISQUALIFIED' | 'SUSPEND_USER', notes?: string) {
    const flag = await this.prisma.fraudFlag.findUnique({ where: { id: flagId } });
    if (!flag) {
      throw new NotFoundException('Fraud flag not found');
    }

    const review = await this.prisma.fraudReview.create({
      data: {
        flagId,
        reviewedBy: reviewerId,
        actionTaken,
        notes,
      },
    });

    if (actionTaken === 'DISQUALIFIED') {
      await this.prisma.quizAttempt.update({
        where: { id: flag.attemptId },
        data: { riskLevel: 'DISQUALIFIED', status: 'DISQUALIFIED' },
      });
    } else if (actionTaken === 'SUSPEND_USER') {
      await this.prisma.user.update({
        where: { id: flag.userId },
        data: { status: 'SUSPENDED' },
      });
      await this.prisma.quizAttempt.update({
        where: { id: flag.attemptId },
        data: { riskLevel: 'DISQUALIFIED', status: 'DISQUALIFIED' },
      });
    }

    return review;
  }
}
