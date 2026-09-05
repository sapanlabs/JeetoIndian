import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('Leaderboard')
@Controller('api/v1/leaderboards')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('competitions/:id')
  @ApiOperation({ summary: 'Get competition rank leaderboard (Public/Participant)' })
  async getCompetitionLeaderboard(
    @Param('id') competitionId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.leaderboardService.getCompetitionLeaderboard(
      competitionId,
      parseInt(limit, 10),
      parseInt(page, 10),
    );
  }
}
