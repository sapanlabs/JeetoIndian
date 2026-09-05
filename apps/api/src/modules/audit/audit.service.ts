import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    actorId: string;
    role: string;
    action: string;
    resource: string;
    resourceId?: string;
    ipAddress?: string;
    beforeState?: any;
    afterState?: any;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        role: params.role,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        beforeState: params.beforeState ? JSON.parse(JSON.stringify(params.beforeState)) : undefined,
        afterState: params.afterState ? JSON.parse(JSON.stringify(params.afterState)) : undefined,
      },
    });
  }

  async getAuditLogs(limit = 50) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: { actor: { include: { profile: true } } },
    });
  }
}
