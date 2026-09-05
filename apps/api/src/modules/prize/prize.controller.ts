import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrizeService, CreatePrizeDto } from './prize.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '@jeeto/shared-types';

@ApiTags('Prizes')
@Controller('api/v1/prizes')
export class PrizeController {
  constructor(private readonly prizeService: PrizeService) {}

  @Get()
  @ApiOperation({ summary: 'List all sponsor-funded prizes' })
  async listPrizes() {
    return this.prizeService.listPrizes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prize details and terms' })
  async getPrizeById(@Param('id') id: string) {
    return this.prizeService.getPrizeById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.SPONSOR_MANAGER)
  @ApiOperation({ summary: 'Add new prize to catalogue' })
  async createPrize(@Body() dto: CreatePrizeDto) {
    return this.prizeService.createPrize(dto);
  }
}
