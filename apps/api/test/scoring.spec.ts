import { ScoringService } from '../src/modules/scoring/scoring.service';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = new ScoringService();
  });

  it('should correctly score correct, wrong, and unanswered questions (+100/0/0)', () => {
    const answers = [
      { questionId: 'q1', selectedOptionKey: 'B' as const, correctOptionKey: 'B' as const, timeTakenMs: 4000 },
      { questionId: 'q2', selectedOptionKey: 'A' as const, correctOptionKey: 'C' as const, timeTakenMs: 3000 },
      { questionId: 'q3', selectedOptionKey: null, correctOptionKey: 'A' as const, timeTakenMs: 0 },
    ];

    const result = service.evaluateQuiz(answers);

    expect(result.score).toBe(100);
    expect(result.correctCount).toBe(1);
    expect(result.incorrectCount).toBe(1);
    expect(result.unansweredCount).toBe(1);
    expect(result.totalTimeMs).toBe(7000);
  });

  it('should encode tie-breaker float score such that lower time taken gets higher Redis ZSET score', () => {
    const scorePlayerFast = service.calculateRedisLeaderboardScore(200, 10000); // 200 pts in 10s
    const scorePlayerSlow = service.calculateRedisLeaderboardScore(200, 20000); // 200 pts in 20s

    expect(scorePlayerFast).toBeGreaterThan(scorePlayerSlow);
  });
});
