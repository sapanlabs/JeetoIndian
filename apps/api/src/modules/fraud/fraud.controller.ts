import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FraudService } from './fraud.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '@jeeto/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Anti-Cheat & Risk')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/v1/fraud')
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get('flags')
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.MODERATOR)
  @ApiOperation({ summary: 'List flagged suspicious quiz attempts' })
  async listFlags() {
    return this.fraudService.listFlags();
  }

  @Post('flags/:id/review')
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.MODERATOR)
  @ApiOperation({ summary: 'Submit moderator decision on anti-cheat flag' })
  async reviewFlag(
    @Param('id') flagId: string,
    @CurrentUser('id') reviewerId: string,
    @Body() body: { actionTaken: 'CLEARED' | 'DISQUALIFIED' | 'SUSPEND_USER'; notes?: string },
  ) {
    return this.fraudService.reviewFlag(flagId, reviewerId, body.actionTaken, body.notes);
  }
}
