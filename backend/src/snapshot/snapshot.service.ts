import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma';

/**
 * StudyPlanner 데이터를 Arena 스냅샷으로 집계하는 스케줄러
 * 같은 Hub DB 내 StudyPlanner 테이블(sp_ 접두사)을 직접 조회
 * 매일 자정에 전날의 학습 성과를 집계
 */
@Injectable()
export class SnapshotService {
    private readonly logger = new Logger(SnapshotService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * 매일 자정에 실행: 전날 학습 성과 스냅샷 생성
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async aggregateDailySnapshots() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        this.logger.log(`📊 Starting daily snapshot aggregation for: ${yesterday.toISOString().split('T')[0]}`);

        try {
            await this.aggregateForDate(yesterday);
            this.logger.log('✅ Daily snapshot aggregation completed');
        } catch (error) {
            this.logger.error('❌ Daily snapshot aggregation failed:', error);
        }
    }

    /**
     * 특정 날짜의 스냅샷 생성
     * 같은 DB 내 StudyPlanner 테이블을 직접 조회 (raw SQL)
     */
    async aggregateForDate(date: Date) {
        // 1. 모든 활성 아레나 멤버 조회
        const members = await this.prisma.arenaMember.findMany({
            where: { isActive: true },
            include: { arena: true },
        });

        if (members.length === 0) {
            this.logger.log('No active arena members found');
            return;
        }

        const dateStart = new Date(date);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(date);
        dateEnd.setHours(23, 59, 59, 999);

        let createdCount = 0;

        for (const member of members) {
            try {
                // 2. 같은 DB 내 StudyPlanner 테이블에서 일일 미션 데이터 조회
                const missions = await this.prisma.$queryRaw<any[]>`
          SELECT 
            COUNT(*)::int as total_missions,
            COUNT(CASE WHEN status = 'completed' THEN 1 END)::int as completed_missions
          FROM sp_daily_mission
          WHERE student_id = ${member.studentId}
            AND date >= ${dateStart}
            AND date <= ${dateEnd}
        `;

                // 3. 미션 결과에서 학습 시간 및 몰입도 조회
                const results = await this.prisma.$queryRaw<any[]>`
          SELECT 
            COALESCE(SUM(
              EXTRACT(EPOCH FROM (mr.end_time - mr.start_time)) / 60
            ), 0)::int as total_study_min,
            AVG(mr.focus_rate)::numeric(3,2) as avg_focus_rate
          FROM sp_mission_result mr
          JOIN sp_daily_mission dm ON dm.id = mr.mission_id
          WHERE mr.student_id = ${member.studentId}
            AND dm.date >= ${dateStart}
            AND dm.date <= ${dateEnd}
        `;

                const missionData = missions[0] || { total_missions: 0, completed_missions: 0 };
                const resultData = results[0] || { total_study_min: 0, avg_focus_rate: null };

                const totalMissions = missionData.total_missions || 0;
                const completedMissions = missionData.completed_missions || 0;
                const achievementPct = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;
                const totalStudyMin = resultData.total_study_min || 0;
                const avgFocusRate = resultData.avg_focus_rate;

                // 4. 종합 점수 계산 (가중치: 완료율 50% + 학습시간 30% + 몰입도 20%)
                const studyTimeNormalized = Math.min(totalStudyMin / 480, 1) * 100; // 8시간 = 100%
                const focusScore = avgFocusRate ? Number(avgFocusRate) * 100 : 50; // null이면 기본 50점
                const score =
                    achievementPct * 0.5 +
                    studyTimeNormalized * 0.3 +
                    focusScore * 0.2;

                // 5. 스냅샷 저장 (upsert)
                await this.prisma.dailySnapshot.upsert({
                    where: {
                        uk_sa_snapshot_arena_student_date: {
                            arenaId: member.arenaId,
                            studentId: member.studentId,
                            date: dateStart,
                        },
                    },
                    update: {
                        totalMissions,
                        completedMissions,
                        achievementPct,
                        totalStudyMin,
                        avgFocusRate,
                        score,
                    },
                    create: {
                        arenaId: member.arenaId,
                        memberId: member.id,
                        studentId: member.studentId,
                        date: dateStart,
                        totalMissions,
                        completedMissions,
                        achievementPct,
                        totalStudyMin,
                        avgFocusRate,
                        score,
                    },
                });

                createdCount++;
            } catch (error) {
                this.logger.error(
                    `Failed to create snapshot for member ${Number(member.id)}: ${error}`,
                );
            }
        }

        this.logger.log(`Created/updated ${createdCount} snapshots for ${date.toISOString().split('T')[0]}`);
    }

    /**
     * 수동 트리거: 특정 날짜 범위의 스냅샷 재생성
     */
    async rebuildSnapshots(startDate: Date, endDate: Date) {
        const current = new Date(startDate);
        while (current <= endDate) {
            await this.aggregateForDate(new Date(current));
            current.setDate(current.getDate() + 1);
        }
    }

    /**
     * 아레나 통계 데이터 (차트용 시계열)
     * period: daily(최근 30일), weekly(최근 12주), monthly(최근 12개월)
     */
    async getStatistics(arenaId: number, period: 'daily' | 'weekly' | 'monthly' = 'daily') {
        const { startDate, endDate } = this.getStatsDateRange(period);

        const snapshots = await this.prisma.dailySnapshot.findMany({
            where: {
                arenaId: BigInt(arenaId),
                date: { gte: startDate, lte: endDate },
            },
            orderBy: { date: 'asc' },
        });

        if (period === 'daily') {
            return this.aggregateDaily(snapshots, startDate, endDate);
        } else if (period === 'weekly') {
            return this.aggregateWeekly(snapshots, startDate, endDate);
        } else {
            return this.aggregateMonthly(snapshots, startDate, endDate);
        }
    }

    private getStatsDateRange(period: 'daily' | 'weekly' | 'monthly') {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        switch (period) {
            case 'daily':
                startDate.setDate(startDate.getDate() - 29);
                break;
            case 'weekly':
                startDate.setDate(startDate.getDate() - 83); // ~12 weeks
                break;
            case 'monthly':
                startDate.setMonth(startDate.getMonth() - 11);
                startDate.setDate(1);
                break;
        }
        return { startDate, endDate };
    }

    private aggregateDaily(snapshots: any[], startDate: Date, endDate: Date) {
        const dayMap = new Map<string, { totalStudyMin: number; achievementPct: number; score: number; count: number }>();

        // Initialize all days
        const cur = new Date(startDate);
        while (cur <= endDate) {
            const key = cur.toISOString().split('T')[0];
            dayMap.set(key, { totalStudyMin: 0, achievementPct: 0, score: 0, count: 0 });
            cur.setDate(cur.getDate() + 1);
        }

        for (const snap of snapshots) {
            const key = new Date(snap.date).toISOString().split('T')[0];
            const existing = dayMap.get(key);
            if (existing) {
                existing.totalStudyMin += snap.totalStudyMin;
                existing.achievementPct += Number(snap.achievementPct);
                existing.score += Number(snap.score);
                existing.count++;
            }
        }

        return Array.from(dayMap.entries()).map(([date, data]) => ({
            label: date.slice(5), // MM-DD
            date,
            totalStudyMin: data.count > 0 ? Math.round(data.totalStudyMin / data.count) : 0,
            achievementPct: data.count > 0 ? Math.round(data.achievementPct / data.count) : 0,
            score: data.count > 0 ? Math.round((data.score / data.count) * 10) / 10 : 0,
            memberCount: data.count,
        }));
    }

    private aggregateWeekly(snapshots: any[], startDate: Date, endDate: Date) {
        const weekMap = new Map<string, { totalStudyMin: number; achievementPct: number; score: number; count: number }>();

        // Group snapshots by ISO week
        for (const snap of snapshots) {
            const d = new Date(snap.date);
            const weekStart = new Date(d);
            weekStart.setDate(d.getDate() - d.getDay()); // Sunday start
            const key = weekStart.toISOString().split('T')[0];

            const existing = weekMap.get(key) || { totalStudyMin: 0, achievementPct: 0, score: 0, count: 0 };
            existing.totalStudyMin += snap.totalStudyMin;
            existing.achievementPct += Number(snap.achievementPct);
            existing.score += Number(snap.score);
            existing.count++;
            weekMap.set(key, existing);
        }

        return Array.from(weekMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([weekStart, data]) => ({
                label: weekStart.slice(5), // MM-DD (week start)
                date: weekStart,
                totalStudyMin: data.count > 0 ? Math.round(data.totalStudyMin / data.count) : 0,
                achievementPct: data.count > 0 ? Math.round(data.achievementPct / data.count) : 0,
                score: data.count > 0 ? Math.round((data.score / data.count) * 10) / 10 : 0,
                memberCount: data.count,
            }));
    }

    private aggregateMonthly(snapshots: any[], _startDate: Date, _endDate: Date) {
        const monthMap = new Map<string, { totalStudyMin: number; achievementPct: number; score: number; count: number }>();

        for (const snap of snapshots) {
            const d = new Date(snap.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

            const existing = monthMap.get(key) || { totalStudyMin: 0, achievementPct: 0, score: 0, count: 0 };
            existing.totalStudyMin += snap.totalStudyMin;
            existing.achievementPct += Number(snap.achievementPct);
            existing.score += Number(snap.score);
            existing.count++;
            monthMap.set(key, existing);
        }

        return Array.from(monthMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => ({
                label: month.slice(5) + '월', // M월
                date: month,
                totalStudyMin: data.count > 0 ? Math.round(data.totalStudyMin / data.count) : 0,
                achievementPct: data.count > 0 ? Math.round(data.achievementPct / data.count) : 0,
                score: data.count > 0 ? Math.round((data.score / data.count) * 10) / 10 : 0,
                memberCount: data.count,
            }));
    }
}
