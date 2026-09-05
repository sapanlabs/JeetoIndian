import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateSponsorDto {
  name: string;
  logoUrl: string;
  website?: string;
  description?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
}

@Injectable()
export class SponsorService {
  constructor(private prisma: PrismaService) {}

  async createSponsor(dto: CreateSponsorDto) {
    return this.prisma.sponsor.create({
      data: {
        name: dto.name,
        logoUrl: dto.logoUrl,
        website: dto.website,
        description: dto.description,
        contacts: {
          create: {
            name: dto.contactName,
            email: dto.contactEmail,
            phone: dto.contactPhone,
            isPrimary: true,
          },
        },
      },
      include: { contacts: true },
    });
  }

  async listSponsors() {
    return this.prisma.sponsor.findMany({
      include: { contacts: true, campaigns: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSponsorById(id: string) {
    const sponsor = await this.prisma.sponsor.findUnique({
      where: { id },
      include: { contacts: true, campaigns: true, prizes: true },
    });
    if (!sponsor) {
      throw new NotFoundException('Sponsor not found');
    }
    return sponsor;
  }
}
