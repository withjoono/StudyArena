import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

/**
 * Redis 기반 실시간 랭킹 서비스
 * Phase 3: Redis 연결 시 Sorted Set 활용
 * 현재: 인메모리 Sorted Map으로 동일 인터페이스 제공
 */
@Injectable()
export class RankingCacheService implements OnModuleDestroy {
    private readonly logger = new Logger(RankingCacheService.name);

    // 인메모리 대체 (Phase 3에서 Redis로 교체)
    // key: `arena:{arenaId}:league:{tier}` or `arena:{arenaId}:daily`
    private sortedSets = new Map<string, Map<string, number>>();

    onModuleDestroy() {
        this.sortedSets.clear();
    }

    /** 점수 업데이트 (ZADD) */
    async setScore(key: string, memberId: number, score: number): Promise<void> {
        if (!this.sortedSets.has(key)) {
            this.sortedSets.set(key, new Map());
        }
        this.sortedSets.get(key)!.set(String(memberId), score);
    }

    /** 순위 조회 (ZREVRANK) — 0-indexed */
    async getRank(key: string, memberId: number): Promise<number | null> {
        const set = this.sortedSets.get(key);
        if (!set) return null;

        const sorted = this.getSortedEntries(set);
        const idx = sorted.findIndex(([id]) => id === String(memberId));
        return idx >= 0 ? idx : null;
    }

    /** 상위 N명 (ZREVRANGE) */
    async getTopN(key: string, n: number): Promise<{ memberId: number; score: number; rank: number }[]> {
        const set = this.sortedSets.get(key);
        if (!set) return [];

        return this.getSortedEntries(set)
            .slice(0, n)
            .map(([id, score], idx) => ({
                memberId: parseInt(id, 10),
                score,
                rank: idx + 1,
            }));
    }

    /** 특정 범위 조회 (ZREVRANGE start stop) */
    async getRange(key: string, start: number, stop: number): Promise<{ memberId: number; score: number; rank: number }[]> {
        const set = this.sortedSets.get(key);
        if (!set) return [];

        return this.getSortedEntries(set)
            .slice(start, stop + 1)
            .map(([id, score], idx) => ({
                memberId: parseInt(id, 10),
                score,
                rank: start + idx + 1,
            }));
    }

    /** 총 멤버 수 (ZCARD) */
    async getCount(key: string): Promise<number> {
        return this.sortedSets.get(key)?.size || 0;
    }

    /** 점수 증가 (ZINCRBY) */
    async incrementScore(key: string, memberId: number, increment: number): Promise<number> {
        if (!this.sortedSets.has(key)) {
            this.sortedSets.set(key, new Map());
        }
        const set = this.sortedSets.get(key)!;
        const current = set.get(String(memberId)) || 0;
        const newScore = current + increment;
        set.set(String(memberId), newScore);
        return newScore;
    }

    /** 멤버 삭제 (ZREM) */
    async removeMember(key: string, memberId: number): Promise<void> {
        this.sortedSets.get(key)?.delete(String(memberId));
    }

    /** 키 삭제 (DEL) */
    async deleteKey(key: string): Promise<void> {
        this.sortedSets.delete(key);
    }

    /** 주변 순위 (내 위아래 N명) */
    async getNearby(key: string, memberId: number, range: number = 3): Promise<{
        memberId: number; score: number; rank: number;
    }[]> {
        const rank = await this.getRank(key, memberId);
        if (rank === null) return [];

        const start = Math.max(0, rank - range);
        const stop = rank + range;
        return this.getRange(key, start, stop);
    }

    // ===== 리그별 캐시 키 헬퍼 =====

    /** 일간 리더보드 키 */
    dailyKey(arenaId: number): string {
        const today = new Date().toISOString().split('T')[0];
        return `arena:${arenaId}:daily:${today}`;
    }

    /** 주간 리더보드 키 */
    weeklyKey(arenaId: number): string {
        const now = new Date();
        const weekNum = Math.ceil(now.getDate() / 7);
        return `arena:${arenaId}:weekly:${now.getFullYear()}-W${weekNum}`;
    }

    /** 리그별 키 */
    leagueKey(arenaId: number, tier: string): string {
        return `arena:${arenaId}:league:${tier}`;
    }

    // ===== 벌크 업데이트 =====

    /** 일괄 점수 업데이트 */
    async bulkSetScores(key: string, entries: { memberId: number; score: number }[]): Promise<void> {
        if (!this.sortedSets.has(key)) {
            this.sortedSets.set(key, new Map());
        }
        const set = this.sortedSets.get(key)!;
        for (const { memberId, score } of entries) {
            set.set(String(memberId), score);
        }
    }

    private getSortedEntries(map: Map<string, number>): [string, number][] {
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    }
}
