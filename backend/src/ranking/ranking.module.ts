import { Module } from '@nestjs/common';
import { RankingCacheService } from './ranking-cache.service';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';

@Module({
    controllers: [RankingController],
    providers: [RankingCacheService, RankingService],
    exports: [RankingCacheService, RankingService],
})
export class RankingModule { }

