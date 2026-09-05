import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CompetitionService, CreateCompetitionDto } from './competition.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '@jeeto/shared-types';

@ApiTags('Competitions')
@Controller('api/v1/competitions')
export class CompetitionController {
  constructor(private readonly competitionService: CompetitionService) {}

  @Get()
  @ApiOperation({ summary: 'List active and upcoming free competitions' })
  async getActiveCompetitions() {
    return this.competitionService.getActiveCompetitions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get competition details and rules' })
  async getCompetitionDetails(@Param('id') id: string) {
    return this.competitionService.getCompetitionDetails(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.CONTENT_MANAGER)
  @ApiOperation({ summary: 'Create new competition draft' })
  async createCompetition(@Body() dto: CreateCompetitionDto) {
    return this.competitionService.createCompetition(dto);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiOperation({ summary: 'Advance competition lifecycle state' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.competitionService.updateStatus(id, status);
  }
}
