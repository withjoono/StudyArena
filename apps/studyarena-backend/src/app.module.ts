import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma';
import { ArenaModule } from './arena/arena.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { SnapshotModule } from './snapshot/snapshot.module';

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
    ],
})
export class AppModule { }
