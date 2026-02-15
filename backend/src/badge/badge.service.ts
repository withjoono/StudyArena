import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

const BADGE_DEFINITIONS = [
    // 스트릭 배지
    { code: 'streak_3', name: '3일 연속', description: '3일 연속 학습 달성', icon: '🔥', category: 'streak', condition: { type: 'streak', value: 3 }, rarity: 'common' },
    { code: 'streak_7', name: '1주 연속', description: '7일 연속 학습 달성', icon: '💪', category: 'streak', condition: { type: 'streak', value: 7 }, rarity: 'common' },
    { code: 'streak_14', name: '2주 연속', description: '14일 연속 학습 달성', icon: '⚡', category: 'streak', condition: { type: 'streak', value: 14 }, rarity: 'rare' },
    { code: 'streak_30', name: '한 달 연속', description: '30일 연속 학습 달성', icon: '🏆', category: 'streak', condition: { type: 'streak', value: 30 }, rarity: 'epic' },
    // 학습시간 배지
    { code: 'hours_10', name: '10시간 돌파', description: '누적 10시간 학습', icon: '⏰', category: 'time', condition: { type: 'hours', value: 10 }, rarity: 'common' },
    { code: 'hours_50', name: '50시간 돌파', description: '누적 50시간 학습', icon: '📚', category: 'time', condition: { type: 'hours', value: 50 }, rarity: 'rare' },
    { code: 'hours_100', name: '100시간 돌파', description: '누적 100시간 학습', icon: '🎓', category: 'time', condition: { type: 'hours', value: 100 }, rarity: 'epic' },
    { code: 'hours_500', name: '500시간 전설', description: '누적 500시간 학습', icon: '👑', category: 'time', condition: { type: 'hours', value: 500 }, rarity: 'legendary' },
    // 미션 배지
    { code: 'missions_10', name: '미션 10개', description: '미션 10개 완료', icon: '✅', category: 'mission', condition: { type: 'missions', value: 10 }, rarity: 'common' },
    { code: 'missions_50', name: '미션 50개', description: '미션 50개 완료', icon: '🎯', category: 'mission', condition: { type: 'missions', value: 50 }, rarity: 'rare' },
    { code: 'missions_100', name: '미션 100개', description: '미션 100개 완료', icon: '💎', category: 'mission', condition: { type: 'missions', value: 100 }, rarity: 'epic' },
    // 소셜 배지
    { code: 'cheer_10', name: '응원단', description: '응원 10회 전송', icon: '📣', category: 'social', condition: { type: 'cheers_sent', value: 10 }, rarity: 'common' },
    { code: 'cheer_received_10', name: '인기인', description: '응원 10회 수신', icon: '🌟', category: 'social', condition: { type: 'cheers_received', value: 10 }, rarity: 'common' },
    { code: 'league_gold', name: '골드 달성', description: '골드 리그 진입', icon: '🥇', category: 'league', condition: { type: 'league', value: 'gold' }, rarity: 'rare' },
    { code: 'league_master', name: '마스터 달성', description: '마스터 리그 진입', icon: '👑', category: 'league', condition: { type: 'league', value: 'master' }, rarity: 'legendary' },
];

@Injectable()
export class BadgeService {
    private readonly logger = new Logger(BadgeService.name);

    constructor(private readonly prisma: PrismaService) { }

    /** 배지 시드 데이터 */
    async seedBadges() {
        let created = 0;
        for (const def of BADGE_DEFINITIONS) {
            await this.prisma.badge.upsert({
                where: { code: def.code },
                create: {
                    ...def,
                    condition: def.condition as any,
                    sortOrder: BADGE_DEFINITIONS.indexOf(def),
                },
                update: {
                    name: def.name,
                    description: def.description,
                    icon: def.icon,
                    rarity: def.rarity,
                },
            });
            created++;
        }
        return { message: 'Badges seeded', count: created };
    }

    /** 전체 배지 목록 */
    async getAllBadges() {
        const badges = await this.prisma.badge.findMany({
            orderBy: { sortOrder: 'asc' },
        });
        return badges.map(this.serialize);
    }

    /** 멤버의 획득 배지 */
    async getMyBadges(memberId: number) {
        const memberBadges = await this.prisma.memberBadge.findMany({
            where: { memberId: BigInt(memberId) },
            include: { badge: true },
            orderBy: { earnedAt: 'desc' },
        });
        return memberBadges.map((mb: any) => ({
            id: Number(mb.id),
            earnedAt: mb.earnedAt,
            badge: this.serialize(mb.badge),
        }));
    }

    /** 배지 수여 */
    async awardBadge(memberId: number, badgeCode: string, arenaId: number) {
        const badge = await this.prisma.badge.findUnique({ where: { code: badgeCode } });
        if (!badge) return null;

        // 이미 획득했는지 확인
        const existing = await this.prisma.memberBadge.findUnique({
            where: { uk_sa_member_badge: { memberId: BigInt(memberId), badgeId: badge.id } },
        });
        if (existing) return null;

        const mb = await this.prisma.memberBadge.create({
            data: {
                memberId: BigInt(memberId),
                badgeId: badge.id,
                arenaId: BigInt(arenaId),
            },
            include: { badge: true },
        });

        this.logger.log(`Badge '${badgeCode}' awarded to member ${memberId}`);
        return {
            id: Number(mb.id),
            earnedAt: mb.earnedAt,
            badge: this.serialize(mb.badge),
        };
    }

    /** 스트릭 체크 및 배지 자동 수여 */
    async checkStreakBadges(memberId: number, arenaId: number, streakDays: number) {
        const streakBadges = BADGE_DEFINITIONS.filter(b => b.category === 'streak');
        const results: any[] = [];

        for (const def of streakBadges) {
            if (streakDays >= (def.condition as any).value) {
                const result = await this.awardBadge(memberId, def.code, arenaId);
                if (result) results.push(result);
            }
        }

        return results;
    }

    /** 학습시간 배지 자동 수여 (누적 시간 기반) */
    async checkStudyTimeBadges(memberId: number, arenaId: number, totalHours: number) {
        const timeBadges = BADGE_DEFINITIONS.filter(b => b.category === 'time');
        const results: any[] = [];

        for (const def of timeBadges) {
            if (totalHours >= (def.condition as any).value) {
                const result = await this.awardBadge(memberId, def.code, arenaId);
                if (result) results.push(result);
            }
        }
        return results;
    }

    /** 미션 완료 배지 자동 수여 */
    async checkMissionBadges(memberId: number, arenaId: number, completedCount: number) {
        const missionBadges = BADGE_DEFINITIONS.filter(b => b.category === 'mission');
        const results: any[] = [];

        for (const def of missionBadges) {
            if (completedCount >= (def.condition as any).value) {
                const result = await this.awardBadge(memberId, def.code, arenaId);
                if (result) results.push(result);
            }
        }
        return results;
    }

    /** 응원 배지 자동 수여 (보내기 & 받기) */
    async checkCheerBadges(memberId: number, arenaId: number, cheersSent: number, cheersReceived: number) {
        const results: any[] = [];

        for (const def of BADGE_DEFINITIONS.filter(b => b.category === 'social')) {
            const cond = def.condition as any;
            if (cond.type === 'cheers_sent' && cheersSent >= cond.value) {
                const result = await this.awardBadge(memberId, def.code, arenaId);
                if (result) results.push(result);
            }
            if (cond.type === 'cheers_received' && cheersReceived >= cond.value) {
                const result = await this.awardBadge(memberId, def.code, arenaId);
                if (result) results.push(result);
            }
        }
        return results;
    }

    /** 리그 배지 자동 수여 */
    async checkLeagueBadges(memberId: number, arenaId: number, currentTier: string) {
        const results: any[] = [];

        for (const def of BADGE_DEFINITIONS.filter(b => b.category === 'league')) {
            const cond = def.condition as any;
            if (cond.type === 'league' && cond.value === currentTier) {
                const result = await this.awardBadge(memberId, def.code, arenaId);
                if (result) results.push(result);
            }
        }
        return results;
    }

    /** 종합 배지 체크 — 모든 카테고리 한번에 검사 */
    async checkAllBadges(memberId: number, arenaId: number, stats: {
        streakDays?: number;
        totalHours?: number;
        completedMissions?: number;
        cheersSent?: number;
        cheersReceived?: number;
        currentTier?: string;
    }) {
        const allResults: any[] = [];

        if (stats.streakDays != null) {
            allResults.push(...await this.checkStreakBadges(memberId, arenaId, stats.streakDays));
        }
        if (stats.totalHours != null) {
            allResults.push(...await this.checkStudyTimeBadges(memberId, arenaId, stats.totalHours));
        }
        if (stats.completedMissions != null) {
            allResults.push(...await this.checkMissionBadges(memberId, arenaId, stats.completedMissions));
        }
        if (stats.cheersSent != null || stats.cheersReceived != null) {
            allResults.push(...await this.checkCheerBadges(
                memberId, arenaId,
                stats.cheersSent || 0,
                stats.cheersReceived || 0,
            ));
        }
        if (stats.currentTier) {
            allResults.push(...await this.checkLeagueBadges(memberId, arenaId, stats.currentTier));
        }

        if (allResults.length > 0) {
            this.logger.log(`Auto-awarded ${allResults.length} badge(s) to member ${memberId}`);
        }
        return allResults;
    }

    private serialize(obj: any) {
        if (!obj) return null;
        const result: any = { ...obj };
        for (const key of Object.keys(result)) {
            if (typeof result[key] === 'bigint') result[key] = Number(result[key]);
        }
        return result;
    }
}
