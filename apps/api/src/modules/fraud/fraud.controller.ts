import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  @ApiQuery({ name: 'status', required: false, description: 'Filter flags by status or rule' })
  @ApiQuery({ name: 'ruleTriggered', required: false, description: 'Filter flags by rule triggered' })
  async listFlags(@Query('status') status?: string, @Query('ruleTriggered') ruleTriggered?: string) {
    return this.fraudService.listFlags(status || ruleTriggered);
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
