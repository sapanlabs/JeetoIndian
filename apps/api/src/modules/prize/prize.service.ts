import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreatePrizeDto {
  title: string;
  description?: string;
  imageUrl: string;
  prizeType: 'PHYSICAL' | 'VOUCHER' | 'COUPON' | 'SPONSOR_PRODUCT';
  estimatedValueInr: number;
  termsConditions?: string;
  sponsorId?: string;
}

@Injectable()
export class PrizeService {
  constructor(private prisma: PrismaService) {}

  async createPrize(dto: CreatePrizeDto) {
    return this.prisma.prize.create({
      data: {
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        prizeType: dto.prizeType,
        estimatedValueInr: dto.estimatedValueInr,
        termsConditions: dto.termsConditions,
        sponsorId: dto.sponsorId,
      },
    });
  }

  async listPrizes() {
    return this.prisma.prize.findMany({
      include: { sponsor: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPrizeById(id: string) {
    const prize = await this.prisma.prize.findUnique({
      where: { id },
      include: { sponsor: true },
    });
    if (!prize) {
      throw new NotFoundException('Prize not found');
    }
    return prize;
  }
}
