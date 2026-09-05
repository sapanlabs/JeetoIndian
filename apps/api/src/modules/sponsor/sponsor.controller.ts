import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SponsorService, CreateSponsorDto } from './sponsor.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '@jeeto/shared-types';

@ApiTags('Sponsors')
@Controller('api/v1/sponsors')
export class SponsorController {
  constructor(private readonly sponsorService: SponsorService) {}

  @Get()
  @ApiOperation({ summary: 'List active brand sponsors' })
  async listSponsors() {
    return this.sponsorService.listSponsors();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sponsor profile & campaigns' })
  async getSponsorById(@Param('id') id: string) {
    return this.sponsorService.getSponsorById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.SPONSOR_MANAGER)
  @ApiOperation({ summary: 'Onboard new brand sponsor' })
  async createSponsor(@Body() dto: CreateSponsorDto) {
    return this.sponsorService.createSponsor(dto);
  }
}
