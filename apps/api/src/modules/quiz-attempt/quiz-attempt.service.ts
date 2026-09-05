import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ScoringService } from '../scoring/scoring.service';
import { SubmitQuizDto } from '@jeeto/validation';

@Injectable()
export class QuizAttemptService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private scoringService: ScoringService,
  ) {}

  async startAttempt(userId: string, competitionId: string) {
    const competition = await this.prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        questions: {
          orderBy: { sequenceOrder: 'asc' },
          include: {
            questionVersion: {
              include: {
                options: {
                  select: {
                    id: true,
                    optionKey: true,
                    optionText: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    if (competition.status !== 'LIVE') {
      throw new BadRequestException(`Competition is not LIVE (current status: ${competition.status})`);
    }

    const now = new Date();
    if (now < competition.startTime || now > competition.endTime) {
      throw new BadRequestException('Competition is outside active playing window');
    }

    // Single Attempt Enforcement via Database Constraint & Redis Lock
    const lockKey = `attempt_lock:${competitionId}:${userId}`;
    const acquired = await this.redis.setNxLock(lockKey, '1', 10);
    if (!acquired) {
      throw new ConflictException('An attempt is already being initialized');
    }

    const existingAttempt = await this.prisma.quizAttempt.findUnique({
      where: {
        competitionId_userId: { competitionId, userId },
      },
    });

    if (existingAttempt) {
      throw new BadRequestException('You have already taken this competition');
    }

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        competitionId,
        userId,
        startedAt: now,
        status: 'IN_PROGRESS',
      },
    });

    const expiresAt = new Date(now.getTime() + competition.durationSeconds * 1000);

    return {
      attemptId: attempt.id,
      competitionId: competition.id,
      durationSeconds: competition.durationSeconds,
      startedAt: attempt.startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      questions: competition.questions.map((cq) => ({
        id: cq.questionId,
        questionText: cq.questionVersion.questionText,
        options: cq.questionVersion.options,
      })),
    };
  }

  async submitAttempt(userId: string, attemptId: string, dto: SubmitQuizDto, idempotencyKey?: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        competition: {
          include: {
            questions: {
              include: {
                questionVersion: {
                  include: { options: true },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Quiz attempt not found');
    }

    if (attempt.userId !== userId) {
      throw new BadRequestException('Attempt belongs to a different user');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return this.getAttemptSummary(attemptId); // Return idempotent result
    }

    const now = new Date();
    const durationGraceMs = (attempt.competition.durationSeconds + 15) * 1000;
    const elapsedMs = now.getTime() - attempt.startedAt.getTime();

    if (elapsedMs > durationGraceMs) {
      await this.prisma.quizAttempt.update({
        where: { id: attemptId },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Quiz submission time expired');
    }

    // Build evaluation inputs
    const evaluationInputs = attempt.competition.questions.map((cq) => {
      const correctOption = cq.questionVersion.options.find((o) => o.isCorrect);
      const userSubmission = dto.answers.find((a) => a.questionId === cq.questionId);

      return {
        questionId: cq.questionId,
        selectedOptionKey: userSubmission?.selectedOptionKey,
        correctOptionKey: (correctOption?.optionKey || 'A') as 'A' | 'B' | 'C' | 'D',
        timeTakenMs: userSubmission?.timeTakenMs || 0,
      };
    });

    const scoreResult = this.scoringService.evaluateQuiz(evaluationInputs);

    // Anti-Cheat Telemetry Ingestion
    let riskLevel: 'NORMAL' | 'SUSPICIOUS' | 'HIGH_RISK' | 'DISQUALIFIED' = 'NORMAL';
    const tooFastAnswers = scoreResult.evaluatedAnswers.filter((a) => a.timeTakenMs > 0 && a.timeTakenMs < 300).length;
    if (tooFastAnswers >= 3) {
      riskLevel = 'SUSPICIOUS';
      await this.prisma.fraudFlag.create({
        data: {
          attemptId,
          userId,
          ruleTriggered: 'FAST_ANSWER_BOT_PATTERN',
          riskScore: 40,
          details: { tooFastAnswers },
        },
      });
    }

    // Save answers & update attempt in a transaction
    const updatedAttempt = await this.prisma.$transaction(async (tx) => {
      await tx.quizAnswer.createMany({
        data: scoreResult.evaluatedAnswers.map((ea) => ({
          attemptId,
          questionId: ea.questionId,
          selectedOptionKey: ea.selectedOptionKey,
          isCorrect: ea.isCorrect,
          timeTakenMs: ea.timeTakenMs,
        })),
      });

      return tx.quizAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'SUBMITTED',
          submittedAt: now,
          score: scoreResult.score,
          totalTimeMs: scoreResult.totalTimeMs,
          riskLevel,
          idempotencyKey,
        },
      });
    });

    // Accelerated Redis Leaderboard ZSET sync
    const redisScore = this.scoringService.calculateRedisLeaderboardScore(scoreResult.score, scoreResult.totalTimeMs);
    await this.redis.zadd(`leaderboard:${attempt.competitionId}`, redisScore, userId);

    return {
      attemptId: updatedAttempt.id,
      score: updatedAttempt.score,
      totalTimeMs: updatedAttempt.totalTimeMs,
      correctCount: scoreResult.correctCount,
      incorrectCount: scoreResult.incorrectCount,
      unansweredCount: scoreResult.unansweredCount,
      status: updatedAttempt.status,
      provisionalRankHint: 'View live leaderboard for real-time rank',
    };
  }

  async getAttemptSummary(attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { answers: true },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
    const incorrectCount = attempt.answers.filter((a) => !a.isCorrect && a.selectedOptionKey).length;
    const unansweredCount = attempt.answers.filter((a) => !a.selectedOptionKey).length;

    return {
      attemptId: attempt.id,
      score: attempt.score,
      totalTimeMs: attempt.totalTimeMs,
      correctCount,
      incorrectCount,
      unansweredCount,
      status: attempt.status,
    };
  }
}
