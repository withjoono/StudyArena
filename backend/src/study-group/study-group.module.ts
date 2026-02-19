import { Module } from '@nestjs/common';
import { StudyGroupController } from './study-group.controller';
import { StudyGroupService } from './study-group.service';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { SnapshotModule } from '../snapshot/snapshot.module';

@Module({
    imports: [LeaderboardModule, SnapshotModule],
    controllers: [StudyGroupController],
    providers: [StudyGroupService],
})
export class StudyGroupModule { }
