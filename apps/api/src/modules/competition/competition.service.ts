import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateCompetitionDto {
  title: string;
  slug: string;
  description?: string;
  bannerUrl?: string;
  category: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  maxAttemptsPerUser?: number;
  questionIds: string[];
  campaignId?: string;
}

@Injectable()
export class CompetitionService {
  constructor(private prisma: PrismaService) {}

  async createCompetition(dto: CreateCompetitionDto) {
    // Validate question availability
    const questions = await this.prisma.question.findMany({
      where: { id: { in: dto.questionIds } },
      include: {
        versions: { orderBy: { version: 'desc' }, take: 1 },
      },
    });

    if (questions.length !== dto.questionIds.length) {
      throw new BadRequestException('One or more selected questions do not exist');
    }

    return this.prisma.competition.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        bannerUrl: dto.bannerUrl,
        category: dto.category,
        status: 'DRAFT',
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        durationSeconds: dto.durationSeconds,
        maxAttemptsPerUser: dto.maxAttemptsPerUser || 1,
        isFreeEntry: true, // MANDATORY FREE-TO-PLAY RULE
        campaignId: dto.campaignId,
        questions: {
          create: questions.map((q, index) => ({
            questionId: q.id,
            questionVersionId: q.versions[0].id,
            sequenceOrder: index + 1,
          })),
        },
      },
      include: {
        questions: {
          include: {
            questionVersion: {
              include: { options: true },
            },
          },
        },
      },
    });
  }

  async updateStatus(id: string, newStatus: any) {
    const competition = await this.prisma.competition.findUnique({ where: { id } });
    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    // State machine validation
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['REVIEW', 'CANCELLED'],
      REVIEW: ['SCHEDULED', 'DRAFT', 'CANCELLED'],
      SCHEDULED: ['LIVE', 'CANCELLED'],
      LIVE: ['ENDED', 'CANCELLED'],
      ENDED: ['RESULT_PROCESSING', 'CANCELLED'],
      RESULT_PROCESSING: ['WINNER_VERIFICATION', 'CANCELLED'],
      WINNER_VERIFICATION: ['COMPLETED', 'CANCELLED'],
    };

    const allowed = validTransitions[competition.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${competition.status} to ${newStatus}`,
      );
    }

    return this.prisma.competition.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  async getActiveCompetitions() {
    return this.prisma.competition.findMany({
      where: {
        status: { in: ['LIVE', 'SCHEDULED'] },
      },
      include: {
        campaign: { include: { sponsor: true } },
        prizes: { include: { prize: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async getCompetitionDetails(id: string) {
    const competition = await this.prisma.competition.findUnique({
      where: { id },
      include: {
        campaign: { include: { sponsor: true } },
        prizes: { include: { prize: true } },
        questions: {
          orderBy: { sequenceOrder: 'asc' },
          include: {
            questionVersion: {
              include: {
                // DO NOT expose correct answers to participants!
                options: {
                  select: {
                    id: true,
                    optionKey: true,
                    optionText: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    return competition;
  }
}
