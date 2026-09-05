import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdService, LogAdEventDto } from './ad.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Monetization Ad System')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/ads')
export class AdController {
  constructor(private readonly adService: AdService) {}

  @Post('opportunity')
  @ApiOperation({ summary: 'Check if monetization ad opportunity is allowed for competition join' })
  async checkAdOpportunity(
    @CurrentUser('id') userId: string,
    @Body('competitionId') competitionId: string,
  ) {
    return this.adService.checkAdOpportunity(userId, competitionId);
  }

  @Post('event')
  @ApiOperation({ summary: 'Log ad telemetry event (IMPRESSION, COMPLETED, SKIPPED, FAILED)' })
  async logAdEvent(
    @CurrentUser('id') userId: string,
    @Body() dto: LogAdEventDto,
  ) {
    return this.adService.logAdEvent(userId, dto);
  }
}
