import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly';

export interface LeaderboardEntry {
    rank: number;
    studentId: number;
    memberId: number;
    totalMissions: number;
    completedMissions: number;
    achievementPct: number;
    totalStudyMin: number;
    avgFocusRate: number | null;
    score: number;
}

@Injectable()
export class LeaderboardService {
    private readonly logger = new Logger(LeaderboardService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * 아레나 리더보드 조회
     */
    async getLeaderboard(
        arenaId: number,
        period: LeaderboardPeriod = 'daily',
    ): Promise<LeaderboardEntry[]> {
        const { startDate, endDate } = this.getDateRange(period);

        const snapshots = await this.prisma.dailySnapshot.findMany({
            where: {
                arenaId: BigInt(arenaId),
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                member: true,
            },
        });

        // 멤버별 집계
        const memberMap = new Map<number, {
            studentId: number;
            memberId: number;
            totalMissions: number;
            completedMissions: number;
            totalStudyMin: number;
            focusRateSum: number;
            focusRateCount: number;
            scoreSum: number;
            dayCount: number;
        }>();

        for (const snap of snapshots) {
            const memberId = Number(snap.memberId);
            const existing = memberMap.get(memberId) || {
                studentId: Number(snap.studentId),
                memberId,
                totalMissions: 0,
                completedMissions: 0,
                totalStudyMin: 0,
                focusRateSum: 0,
                focusRateCount: 0,
                scoreSum: 0,
                dayCount: 0,
            };

            existing.totalMissions += snap.totalMissions;
            existing.completedMissions += snap.completedMissions;
            existing.totalStudyMin += snap.totalStudyMin;
            existing.scoreSum += Number(snap.score);
            existing.dayCount++;

            if (snap.avgFocusRate !== null) {
                existing.focusRateSum += Number(snap.avgFocusRate);
                existing.focusRateCount++;
            }

            memberMap.set(memberId, existing);
        }

        // 평균 점수로 정렬
        const entries = Array.from(memberMap.values())
            .map((m) => ({
                studentId: m.studentId,
                memberId: m.memberId,
                totalMissions: m.totalMissions,
                completedMissions: m.completedMissions,
                achievementPct:
                    m.totalMissions > 0
                        ? Math.round((m.completedMissions / m.totalMissions) * 100)
                        : 0,
                totalStudyMin: m.totalStudyMin,
                avgFocusRate:
                    m.focusRateCount > 0
                        ? Math.round((m.focusRateSum / m.focusRateCount) * 100) / 100
                        : null,
                score: m.dayCount > 0 ? Math.round((m.scoreSum / m.dayCount) * 100) / 100 : 0,
            }))
            .sort((a, b) => b.score - a.score);

        // 순위 부여
        return entries.map((entry, index) => ({
            rank: index + 1,
            ...entry,
        }));
    }

    /**
     * 내 랭킹 조회
     */
    async getMyRanking(
        arenaId: number,
        hubMemberId: number,
        period: LeaderboardPeriod = 'daily',
    ) {
        const leaderboard = await this.getLeaderboard(arenaId, period);
        const myEntry = leaderboard.find(
            (e) => e.memberId === hubMemberId || e.studentId === hubMemberId,
        );

        return {
            leaderboard,
            myRank: myEntry?.rank || null,
            totalParticipants: leaderboard.length,
            myStats: myEntry || null,
        };
    }

    /**
     * 기간 범위 계산
     */
    private getDateRange(period: LeaderboardPeriod): { startDate: Date; endDate: Date } {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(today);

        switch (period) {
            case 'daily':
                return { startDate: today, endDate };
            case 'weekly': {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 6);
                return { startDate: weekAgo, endDate };
            }
            case 'monthly': {
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                return { startDate: monthStart, endDate };
            }
            default:
                return { startDate: today, endDate };
        }
    }
}
