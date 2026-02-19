import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma';
import { ArenaModule } from './arena/arena.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { SnapshotModule } from './snapshot/snapshot.module';
import { LeagueModule } from './league/league.module';
import { ActivityModule } from './activity/activity.module';
import { BadgeModule } from './badge/badge.module';
import { GrowthModule } from './growth/growth.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RankingModule } from './ranking/ranking.module';
import { TeacherModule } from './teacher/teacher.module';
import { AdminModule } from './admin/admin.module';
import { StudyGroupModule } from './study-group/study-group.module';
import { ExamBattleModule } from './exam-battle/exam-battle.module';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // Scheduler (크론잡: 일간 스냅샷 집계)
        ScheduleModule.forRoot(),

        // Authentication (Hub SSO)
        AuthModule,

        // Database (Prisma)
        PrismaModule,

        // Feature Modules
        ArenaModule,
        LeaderboardModule,
        SnapshotModule,
        LeagueModule,
        ActivityModule,
        BadgeModule,
        GrowthModule,
        RealtimeModule,
        RankingModule,
        TeacherModule,
        AdminModule,
        StudyGroupModule,
        ExamBattleModule,
    ],
})
export class AppModule { }
