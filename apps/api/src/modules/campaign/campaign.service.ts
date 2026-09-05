import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateCampaignDto {
  sponsorId: string;
  title: string;
  objective?: string;
  budgetAmount?: number;
  startDate: string;
  endDate: string;
}

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  async createCampaign(dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: {
        sponsorId: dto.sponsorId,
        title: dto.title,
        objective: dto.objective,
        budgetAmount: dto.budgetAmount || 0,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
      include: { sponsor: true },
    });
  }

  async getCampaignAnalytics(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        sponsor: true,
        competitions: {
          include: {
            attempts: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const totalCompetitions = campaign.competitions.length;
    let totalParticipants = 0;
    let totalCompletions = 0;
    let totalScoreSum = 0;

    for (const comp of campaign.competitions) {
      totalParticipants += comp.attempts.length;
      const completed = comp.attempts.filter((a) => a.status === 'SUBMITTED');
      totalCompletions += completed.length;
      totalScoreSum += completed.reduce((sum, a) => sum + a.score, 0);
    }

    const avgScore = totalCompletions > 0 ? (totalScoreSum / totalCompletions).toFixed(1) : 0;

    return {
      campaignId: campaign.id,
      title: campaign.title,
      sponsorName: campaign.sponsor.name,
      metrics: {
        totalCompetitions,
        totalParticipants,
        totalCompletions,
        completionRate: totalParticipants > 0 ? `${((totalCompletions / totalParticipants) * 100).toFixed(1)}%` : '0%',
        averageParticipantScore: Number(avgScore),
        estimatedBrandImpressions: totalParticipants * 12, // High-engagement quiz impressions factor
      },
    };
  }

  async listCampaigns(sponsorId?: string) {
    return this.prisma.campaign.findMany({
      where: { ...(sponsorId && { sponsorId }) },
      include: { sponsor: true, competitions: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
