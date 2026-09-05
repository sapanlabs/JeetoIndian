import { Injectable } from '@nestjs/common';
import { APP_CONFIG } from '@jeeto/config';

export interface AnswerEvaluationInput {
  questionId: string;
  selectedOptionKey?: 'A' | 'B' | 'C' | 'D' | null;
  correctOptionKey: 'A' | 'B' | 'C' | 'D';
  timeTakenMs: number;
}

export interface ScoreResult {
  score: number;
  totalTimeMs: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  evaluatedAnswers: Array<{
    questionId: string;
    selectedOptionKey?: string | null;
    isCorrect: boolean;
    timeTakenMs: number;
  }>;
}

@Injectable()
export class ScoringService {
  evaluateQuiz(answers: AnswerEvaluationInput[]): ScoreResult {
    let score = 0;
    let totalTimeMs = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const evaluatedAnswers = answers.map((answer) => {
      totalTimeMs += answer.timeTakenMs;

      if (!answer.selectedOptionKey) {
        unansweredCount++;
        score += APP_CONFIG.quizDefaults.unansweredScore;
        return {
          questionId: answer.questionId,
          selectedOptionKey: null,
          isCorrect: false,
          timeTakenMs: answer.timeTakenMs,
        };
      }

      const isCorrect = answer.selectedOptionKey === answer.correctOptionKey;
      if (isCorrect) {
        correctCount++;
        score += APP_CONFIG.quizDefaults.correctScore;
      } else {
        incorrectCount++;
        score += APP_CONFIG.quizDefaults.wrongScore;
      }

      return {
        questionId: answer.questionId,
        selectedOptionKey: answer.selectedOptionKey,
        isCorrect,
        timeTakenMs: answer.timeTakenMs,
      };
    });

    return {
      score,
      totalTimeMs,
      correctCount,
      incorrectCount,
      unansweredCount,
      evaluatedAnswers,
    };
  }

  /**
   * Encodes score and tie-breaker criteria into a single Redis ZSET floating-point score.
   * Higher score = higher rank.
   * Secondary tie-breaker: Lower totalTimeMs = higher rank.
   */
  calculateRedisLeaderboardScore(score: number, totalTimeMs: number): number {
    const maxTime = 1000000000; // 1,000,000,000 ms max
    const timeTieBreaker = (maxTime - Math.min(totalTimeMs, maxTime)) / maxTime;
    return score + timeTieBreaker;
  }
}
