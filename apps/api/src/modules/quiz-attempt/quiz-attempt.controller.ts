import { Controller, Post, Get, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { QuizAttemptService } from './quiz-attempt.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubmitQuizDto } from '@jeeto/validation';

@ApiTags('Quiz Attempts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1')
export class QuizAttemptController {
  constructor(private readonly quizAttemptService: QuizAttemptService) {}

  @Post('competitions/:id/attempts/start')
  @ApiOperation({ summary: 'Initialize new server-timed quiz attempt' })
  async startAttempt(
    @CurrentUser('id') userId: string,
    @Param('id') competitionId: string,
  ) {
    return this.quizAttemptService.startAttempt(userId, competitionId);
  }

  @Post('attempts/:id/submit')
  @ApiOperation({ summary: 'Submit quiz answers (Idempotent submission)' })
  @ApiHeader({ name: 'x-idempotency-key', required: false, description: 'Unique submission UUID' })
  async submitAttempt(
    @CurrentUser('id') userId: string,
    @Param('id') attemptId: string,
    @Body() dto: SubmitQuizDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.quizAttemptService.submitAttempt(userId, attemptId, dto, idempotencyKey);
  }

  @Get('attempts/:id/summary')
  @ApiOperation({ summary: 'Get quiz attempt score and summary' })
  async getAttemptSummary(@Param('id') attemptId: string) {
    return this.quizAttemptService.getAttemptSummary(attemptId);
  }
}
