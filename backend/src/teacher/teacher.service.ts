import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

/**
 * 교사 대시보드 서비스
 * - 반(아레나) 전체 통계
 * - 학생별 학습 분석
 * - 참여율 트래킹
 */
@Injectable()
export class TeacherService {
    private readonly logger = new Logger(TeacherService.name);

    constructor(private readonly prisma: PrismaService) { }

    /** 아레나(반) 전체 통계 */
    async getArenaOverview(arenaId: number) {
        const arena = await this.prisma.arena.findUnique({
            where: { id: BigInt(arenaId) },
        });

        const members = await this.prisma.arenaMember.findMany({
            where: { arenaId: BigInt(arenaId), isActive: true },
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySnapshots = await this.prisma.dailySnapshot.findMany({
            where: {
                arenaId: BigInt(arenaId),
                date: today,
            },
        });

        const totalStudyMin = todaySnapshots.reduce(
            (sum: number, s: any) => sum + (s.totalStudyMin || 0), 0,
        );
        const activeMemberCount = todaySnapshots.filter(
            (s: any) => (s.totalStudyMin || 0) > 0,
        ).length;

        return {
            arenaId,
            arenaName: arena?.name || '',
            totalMembers: members.length,
            todayStats: {
                activeMemberCount,
                participationRate: members.length > 0
                    ? Math.round((activeMemberCount / members.length) * 100)
                    : 0,
                totalStudyMinutes: totalStudyMin,
                avgStudyMinutes: activeMemberCount > 0
                    ? Math.round(totalStudyMin / activeMemberCount)
                    : 0,
            },
        };
    }

    /** 학생별 상세 분석 */
    async getMemberDetail(arenaId: number, memberId: number) {
        const member = await this.prisma.arenaMember.findFirst({
            where: {
                id: BigInt(memberId),
                arenaId: BigInt(arenaId),
            },
        });

        if (!member) return null;

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const snapshots = await this.prisma.dailySnapshot.findMany({
            where: {
                memberId: BigInt(memberId),
                arenaId: BigInt(arenaId),
                date: { gte: weekAgo },
            },
            orderBy: { date: 'asc' },
        });

        const activeDays = snapshots.filter((s: any) => (s.totalStudyMin || 0) > 0).length;
        const totalStudyMin = snapshots.reduce(
            (sum: number, s: any) => sum + (s.totalStudyMin || 0), 0,
        );

        return {
            memberId,
            weeklyStats: {
                activeDays,
                consistency: Math.round((activeDays / 7) * 100),
                totalStudyMinutes: totalStudyMin,
                avgDailyMinutes: activeDays > 0 ? Math.round(totalStudyMin / activeDays) : 0,
                dailyData: snapshots.map((s: any) => ({
                    date: s.date,
                    totalStudyMin: s.totalStudyMin || 0,
                    score: s.score ? Number(s.score) : 0,
                })),
            },
        };
    }

    /** 참여율이 낮은 학생 알림 */
    async getLowParticipationMembers(arenaId: number, thresholdDays: number = 3) {
        const members = await this.prisma.arenaMember.findMany({
            where: { arenaId: BigInt(arenaId), isActive: true },
        });

        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

        const lowParticipation = [];

        for (const member of members) {
            const recentActivity = await this.prisma.dailySnapshot.count({
                where: {
                    memberId: member.id,
                    arenaId: BigInt(arenaId),
                    date: { gte: thresholdDate },
                    totalStudyMin: { gt: 0 },
                },
            });

            if (recentActivity === 0) {
                lowParticipation.push({
                    memberId: Number(member.id),
                    studentId: Number(member.studentId),
                    daysSinceActivity: thresholdDays,
                });
            }
        }

        return {
            threshold: `${thresholdDays}일 이상 미활동`,
            count: lowParticipation.length,
            members: lowParticipation,
        };
    }

    /** 주간 반 리포트 */
    async getWeeklyClassReport(arenaId: number) {
        const overview = await this.getArenaOverview(arenaId);
        const lowParticipation = await this.getLowParticipationMembers(arenaId);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const topStudents = await this.prisma.dailySnapshot.groupBy({
            by: ['memberId'],
            where: {
                arenaId: BigInt(arenaId),
                date: { gte: weekAgo },
            },
            _sum: { totalStudyMin: true },
            orderBy: { _sum: { totalStudyMin: 'desc' } },
            take: 5,
        });

        return {
            overview,
            lowParticipation,
            topStudents: topStudents.map((s: any, i: number) => ({
                rank: i + 1,
                memberId: Number(s.memberId),
                totalStudyMin: s._sum.totalStudyMin || 0,
            })),
        };
    }
}
