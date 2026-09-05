import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuditModule } from './modules/audit/audit.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { QuestionModule } from './modules/question/question.module';
import { CompetitionModule } from './modules/competition/competition.module';
import { QuizAttemptModule } from './modules/quiz-attempt/quiz-attempt.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { PrizeModule } from './modules/prize/prize.module';
import { SponsorModule } from './modules/sponsor/sponsor.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { WinnerModule } from './modules/winner/winner.module';
import { FraudModule } from './modules/fraud/fraud.module';
import { AdminModule } from './modules/admin/admin.module';
import { AdModule } from './modules/ad/ad.module';
import { AppController } from './app.controller';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuditModule,
    ScoringModule,
    QueueModule,
    AuthModule,
    UserModule,
    QuestionModule,
    CompetitionModule,
    QuizAttemptModule,
    LeaderboardModule,
    PrizeModule,
    SponsorModule,
    CampaignModule,
    WinnerModule,
    FraudModule,
    AdminModule,
    AdModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
