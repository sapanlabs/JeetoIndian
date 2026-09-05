import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionService, CreateQuestionDto } from './question.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '@jeeto/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Question Bank')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/v1/questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.CONTENT_MANAGER)
  @ApiOperation({ summary: 'Create new MCQ question draft' })
  async createQuestion(@CurrentUser('id') userId: string, @Body() dto: CreateQuestionDto) {
    return this.questionService.createQuestion(userId, dto);
  }

  @Put(':id/version')
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.CONTENT_MANAGER)
  @ApiOperation({ summary: 'Update question (creates new QuestionVersion)' })
  async updateQuestionVersion(
    @Param('id') questionId: string,
    @CurrentUser('id') reviewerId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionService.updateQuestionVersion(questionId, reviewerId, dto);
  }

  @Get()
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.CONTENT_MANAGER)
  @ApiOperation({ summary: 'List question bank items with filtering' })
  async listQuestions(@Query('category') category?: string, @Query('status') status?: string) {
    return this.questionService.listQuestions(category, status);
  }
}
