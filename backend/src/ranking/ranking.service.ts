import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { RankingCacheService } from './ranking-cache.service';

/**
 * 랭킹 서비스 — Snapshot 점수를 RankingCache에 동기화
 * - Snapshot 갱신 시 호출하여 실시간 캐시 업데이트
 * - 리그별 랭킹 분류
 */
@Injectable()
export class RankingService {
    private readonly logger = new Logger(RankingService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cache: RankingCacheService,
    ) { }

    /** 스냅샷 점수를 일간/주간 랭킹캐시에 동기화 */
    async syncFromSnapshot(arenaId: number, memberId: number, score: number) {
        const dailyKey = this.cache.dailyKey(arenaId);
        const weeklyKey = this.cache.weeklyKey(arenaId);

        await this.cache.setScore(dailyKey, memberId, score);
        await this.cache.incrementScore(weeklyKey, memberId, score);

        this.logger.debug(`Synced member ${memberId} score=${score} to daily/weekly cache`);
    }

    /** 리그별 랭킹에 점수 등록 */
    async syncLeagueRanking(arenaId: number, memberId: number, tier: string, score: number) {
        const key = this.cache.leagueKey(arenaId, tier);
        await this.cache.setScore(key, memberId, score);
    }

    /** 아레나 전체 멤버의 일간 점수를 캐시에 벌크 동기화 */
    async bulkSyncDaily(arenaId: number) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const snapshots = await this.prisma.dailySnapshot.findMany({
            where: {
                arenaId: BigInt(arenaId),
                date: { gte: today },
            },
            select: {
                memberId: true,
                score: true,
            },
        });

        const entries = snapshots.map((s: any) => ({
            memberId: Number(s.memberId),
            score: Number(s.score) || 0,
        }));

        const dailyKey = this.cache.dailyKey(arenaId);
        await this.cache.bulkSetScores(dailyKey, entries);

        this.logger.log(`Bulk-synced ${entries.length} members for arena ${arenaId} daily ranking`);
        return { synced: entries.length };
    }

    /** 순위 변동 감지 — syncFromSnapshot 전에 현재 순위 스냅, 후에 비교 */
    async detectRankChange(arenaId: number, memberId: number, newScore: number): Promise<{
        oldRank: number | null;
        newRank: number | null;
        change: number;
    }> {
        const dailyKey = this.cache.dailyKey(arenaId);
        const oldRank = await this.cache.getRank(dailyKey, memberId);

        await this.cache.setScore(dailyKey, memberId, newScore);

        const newRank = await this.cache.getRank(dailyKey, memberId);

        const change = oldRank != null && newRank != null
            ? oldRank - newRank  // +면 상승, -면 하락 (0-indexed)
            : 0;

        return {
            oldRank: oldRank != null ? oldRank + 1 : null,
            newRank: newRank != null ? newRank + 1 : null,
            change,
        };
    }
}
