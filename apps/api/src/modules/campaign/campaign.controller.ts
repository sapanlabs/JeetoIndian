import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignService, CreateCampaignDto } from './campaign.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '@jeeto/shared-types';

@ApiTags('Sponsor Campaigns')
@Controller('api/v1/campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  @ApiOperation({ summary: 'List campaigns with optional sponsor filter' })
  async listCampaigns(@Query('sponsorId') sponsorId?: string) {
    return this.campaignService.listCampaigns(sponsorId);
  }

  @Get(':id/analytics')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.SPONSOR_MANAGER, RoleName.SPONSOR, RoleName.ANALYST)
  @ApiOperation({ summary: 'Get campaign ROI metrics and participant engagement analytics' })
  async getCampaignAnalytics(@Param('id') campaignId: string) {
    return this.campaignService.getCampaignAnalytics(campaignId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.SPONSOR_MANAGER, RoleName.SPONSOR)
  @ApiOperation({ summary: 'Create new sponsored campaign' })
  async createCampaign(@Body() dto: CreateCampaignDto) {
    return this.campaignService.createCampaign(dto);
  }
}
