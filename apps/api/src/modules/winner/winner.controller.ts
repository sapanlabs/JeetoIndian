import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WinnerService } from './winner.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '@jeeto/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Winners & Fulfillment')
@Controller('api/v1/winners')
export class WinnerController {
  constructor(private readonly winnerService: WinnerService) {}

  @Get('competitions/:id')
  @ApiOperation({ summary: 'Get official winners for competition' })
  async getWinners(@Param('id') competitionId: string) {
    return this.winnerService.getWinners(competitionId);
  }

  @Post('competitions/:id/provisional')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.MODERATOR)
  @ApiOperation({ summary: 'Generate provisional winners for admin review' })
  async generateProvisionalWinners(@Param('id') competitionId: string) {
    return this.winnerService.generateProvisionalWinners(competitionId);
  }

  @Post('competitions/:id/confirm')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiOperation({ summary: 'Admin audit & final winner confirmation' })
  async confirmWinners(
    @Param('id') competitionId: string,
    @CurrentUser('id') adminUserId: string,
  ) {
    return this.winnerService.verifyAndConfirmWinners(competitionId, adminUserId);
  }
}
