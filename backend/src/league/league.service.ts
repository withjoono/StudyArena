import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

const LEAGUE_TIERS = [
    { tier: 'bronze', name: '브론즈', icon: '🥉', color: '#cd7f32', sortOrder: 1, percentMax: 100, percentMin: 70 },
    { tier: 'silver', name: '실버', icon: '🥈', color: '#c0c0c0', sortOrder: 2, percentMax: 70, percentMin: 50 },
    { tier: 'gold', name: '골드', icon: '🥇', color: '#ffd700', sortOrder: 3, percentMax: 50, percentMin: 30 },
    { tier: 'platinum', name: '플래티넘', icon: '💎', color: '#00d4ff', sortOrder: 4, percentMax: 30, percentMin: 15 },
    { tier: 'diamond', name: '다이아몬드', icon: '💠', color: '#b9f2ff', sortOrder: 5, percentMax: 15, percentMin: 5 },
    { tier: 'master', name: '마스터', icon: '👑', color: '#ff6b35', sortOrder: 6, percentMax: 5, percentMin: 0 },
];

@Injectable()
export class LeagueService {
    private readonly logger = new Logger(LeagueService.name);

    constructor(private readonly prisma: PrismaService) { }

    /** 리그 초기 데이터 시드 */
    async seedLeagues() {
        for (const tier of LEAGUE_TIERS) {
            await this.prisma.league.upsert({
                where: { tier: tier.tier },
                create: {
                    name: tier.name,
                    tier: tier.tier,
                    icon: tier.icon,
                    color: tier.color,
                    sortOrder: tier.sortOrder,
                },
                update: {
                    name: tier.name,
                    icon: tier.icon,
                    color: tier.color,
                    sortOrder: tier.sortOrder,
                },
            });
        }
        return { message: 'Leagues seeded', count: LEAGUE_TIERS.length };
    }

    /** 리그 목록 */
    async getLeagues() {
        const leagues = await this.prisma.league.findMany({
            orderBy: { sortOrder: 'asc' },
        });
        return leagues.map(this.serialize);
    }

    /** 내 현재 리그 조회 */
    async getMyLeague(arenaId: number, memberId: number) {
        const latest = await this.prisma.memberLeague.findFirst({
            where: {
                arenaId: BigInt(arenaId),
                memberId: BigInt(memberId),
            },
            orderBy: { weekStart: 'desc' },
            include: { league: true },
        });

        if (!latest) {
            const bronzeLeague = await this.prisma.league.findUnique({ where: { tier: 'bronze' } });
            return {
                league: bronzeLeague ? this.serialize(bronzeLeague) : null,
                avgScore: 0,
                promoted: false,
                demoted: false,
            };
        }

        return {
            league: this.serialize(latest.league),
            avgScore: Number(latest.avgScore),
            promoted: latest.promoted,
            demoted: latest.demoted,
        };
    }

    /** 리그별 리더보드 */
    async getLeagueLeaderboard(arenaId: number, tier?: string) {
        const weekStart = this.getCurrentWeekStart();

        const where: any = {
            arenaId: BigInt(arenaId),
            weekStart,
        };
        if (tier) {
            const league = await this.prisma.league.findUnique({ where: { tier } });
            if (league) where.leagueId = league.id;
        }

        const members = await this.prisma.memberLeague.findMany({
            where,
            orderBy: { avgScore: 'desc' },
            include: { league: true },
        });

        return members.map((m, idx) => ({
            rank: idx + 1,
            memberId: Number(m.memberId),
            avgScore: Number(m.avgScore),
            league: this.serialize(m.league),
            promoted: m.promoted,
            demoted: m.demoted,
        }));
    }

    /** 주간 리그 배정 (크론잡에서 호출) */
    async calculateWeeklyLeagues(arenaId: number) {
        const weekStart = this.getCurrentWeekStart();
        const leaderboard = await this.getWeeklyScores(arenaId, weekStart);

        if (leaderboard.length === 0) return { message: 'No data' };

        const leagues = await this.prisma.league.findMany({
            orderBy: { sortOrder: 'asc' },
        });

        const totalMembers = leaderboard.length;
        const results: any[] = [];

        for (const [idx, entry] of leaderboard.entries()) {
            const percentile = ((idx + 1) / totalMembers) * 100;

            // 퍼센타일에 따른 리그 배정
            let assignedLeague = leagues[0]; // 기본 브론즈
            for (const tier of LEAGUE_TIERS) {
                const league = leagues.find(l => l.tier === tier.tier);
                if (league && percentile <= tier.percentMax && percentile > tier.percentMin) {
                    assignedLeague = league;
                    break;
                }
            }

            // 이전 리그 대비 승/강 판단
            const prevLeague = await this.prisma.memberLeague.findFirst({
                where: {
                    memberId: BigInt(entry.memberId),
                    arenaId: BigInt(arenaId),
                    weekStart: { lt: weekStart },
                },
                orderBy: { weekStart: 'desc' },
                include: { league: true },
            });

            const prevSort = prevLeague?.league?.sortOrder ?? 1;
            const promoted = assignedLeague.sortOrder > prevSort;
            const demoted = assignedLeague.sortOrder < prevSort;

            await this.prisma.memberLeague.upsert({
                where: {
                    uk_sa_member_league: {
                        memberId: BigInt(entry.memberId),
                        arenaId: BigInt(arenaId),
                        weekStart,
                    },
                },
                create: {
                    memberId: BigInt(entry.memberId),
                    leagueId: assignedLeague.id,
                    arenaId: BigInt(arenaId),
                    weekStart,
                    avgScore: entry.avgScore,
                    promoted,
                    demoted,
                },
                update: {
                    leagueId: assignedLeague.id,
                    avgScore: entry.avgScore,
                    promoted,
                    demoted,
                },
            });

            results.push({
                memberId: entry.memberId,
                league: assignedLeague.tier,
                promoted,
                demoted,
            });
        }

        return { message: 'Leagues calculated', results };
    }

    private async getWeeklyScores(arenaId: number, weekStart: Date) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const snapshots = await this.prisma.dailySnapshot.findMany({
            where: {
                arenaId: BigInt(arenaId),
                date: { gte: weekStart, lte: weekEnd },
            },
        });

        const memberMap = new Map<number, { total: number; count: number }>();
        for (const snap of snapshots) {
            const mid = Number(snap.memberId);
            const existing = memberMap.get(mid) || { total: 0, count: 0 };
            existing.total += Number(snap.score);
            existing.count++;
            memberMap.set(mid, existing);
        }

        return Array.from(memberMap.entries())
            .map(([memberId, data]) => ({
                memberId,
                avgScore: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
            }))
            .sort((a, b) => b.avgScore - a.avgScore);
    }

    private getCurrentWeekStart(): Date {
        const now = new Date();
        const day = now.getDay();
        const diff = day === 0 ? 6 : day - 1; // Monday start
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - diff);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }

    private serialize(obj: any) {
        if (!obj) return null;
        const result: any = { ...obj };
        for (const key of Object.keys(result)) {
            if (typeof result[key] === 'bigint') result[key] = Number(result[key]);
            if (result[key] instanceof Object && result[key].constructor.name === 'Decimal')
                result[key] = Number(result[key]);
        }
        return result;
    }
}
