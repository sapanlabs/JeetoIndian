import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      status: user.status,
      roles: user.roles.map((ur) => ur.role.name),
      profile: user.profile,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, data: { displayName?: string; state?: string; city?: string; pincode?: string; avatarUrl?: string }) {
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.state && { state: data.state }),
        ...(data.city && { city: data.city }),
        ...(data.pincode && { pincode: data.pincode }),
        ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
      },
      create: {
        userId,
        displayName: data.displayName || 'Participant',
        state: data.state,
        city: data.city,
        pincode: data.pincode,
        avatarUrl: data.avatarUrl,
      },
    });

    return profile;
  }
}
