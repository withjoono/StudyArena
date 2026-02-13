import { Module } from '@nestjs/common';
import { RankingCacheService } from './ranking-cache.service';
import { RankingController } from './ranking.controller';

@Module({
    controllers: [RankingController],
    providers: [RankingCacheService],
    exports: [RankingCacheService],
})
export class RankingModule { }
