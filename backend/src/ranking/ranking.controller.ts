import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RankingCacheService } from './ranking-cache.service';

@Controller('ranking')
@UseGuards(AuthGuard('jwt'))
export class RankingController {
    constructor(private readonly rankingCache: RankingCacheService) { }

    /** 실시간 상위 N명 */
    @Get('top')
    async getTop(
        @Query('arenaId') arenaId: string,
        @Query('n') n?: string,
        @Query('period') period?: string,
    ) {
        const id = parseInt(arenaId, 10);
        const key = period === 'weekly'
            ? this.rankingCache.weeklyKey(id)
            : this.rankingCache.dailyKey(id);

        return this.rankingCache.getTopN(key, parseInt(n || '10', 10));
    }

    /** 내 순위 + 주변 */
    @Get('nearby')
    async getNearby(
        @Query('arenaId') arenaId: string,
        @Query('memberId') memberId: string,
        @Query('period') period?: string,
    ) {
        const id = parseInt(arenaId, 10);
        const key = period === 'weekly'
            ? this.rankingCache.weeklyKey(id)
            : this.rankingCache.dailyKey(id);

        const mid = parseInt(memberId, 10);
        const [rank, nearby, total] = await Promise.all([
            this.rankingCache.getRank(key, mid),
            this.rankingCache.getNearby(key, mid),
            this.rankingCache.getCount(key),
        ]);

        return {
            myRank: rank !== null ? rank + 1 : null,
            totalMembers: total,
            nearby,
        };
    }

    /** 리그별 랭킹 */
    @Get('league')
    async getLeagueRanking(
        @Query('arenaId') arenaId: string,
        @Query('tier') tier: string,
        @Query('n') n?: string,
    ) {
        const key = this.rankingCache.leagueKey(parseInt(arenaId, 10), tier);
        return this.rankingCache.getTopN(key, parseInt(n || '20', 10));
    }
}
