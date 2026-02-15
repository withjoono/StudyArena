import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

/**
 * 성적 기반 성장 점수 서비스
 * 성적이 낮은 학생의 큰 폭 향상 시 '성장 점수' 가산
 */
@Injectable()
export class GrowthService {
    private readonly logger = new Logger(GrowthService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * 성장 점수 계산
     * 공식: 향상폭 × 기준점수계수
     * - 낮은 등급에서 올라올수록 더 높은 가산점
     * - 예: 6등급→4등급 (2단계 향상) > 2등급→1등급 (1단계 향상) 보다 높은 점수
     */
    calculateGrowthScore(
        previousGrade: number,
        currentGrade: number,
    ): { growthScore: number; improvement: number; bonus: string } {
        const improvement = previousGrade - currentGrade; // 양수 = 등급 상승

        if (improvement <= 0) {
            return { growthScore: 0, improvement: 0, bonus: '' };
        }

        // 기준점수계수: 낮은 등급에서 올라올수록 높은 가산
        const baseMultiplier = this.getBaseMultiplier(previousGrade);
        const growthScore = Math.round(improvement * baseMultiplier * 100) / 100;

        let bonus = '';
        if (improvement >= 3) bonus = '🚀 대폭 향상!';
        else if (improvement >= 2) bonus = '🔥 멋진 성장!';
        else if (improvement >= 1) bonus = '💪 꾸준한 향상!';

        return { growthScore, improvement, bonus };
    }

    /** 멤버의 성장 점수 계산 (SP exam score 데이터 기반) */
    async getMemberGrowthScore(memberId: number, arenaId: number) {
        // 멤버의 studentId 조회
        const member = await this.prisma.arenaMember.findUnique({
            where: { id: BigInt(memberId) },
        });
        if (!member) {
            return { memberId, arenaId, currentGrowthScore: 0, recentImprovements: [], message: '멤버를 찾을 수 없습니다.' };
        }

        try {
            // sp_exam_score에서 과목별 최근 2개 시험 성적 조회
            const examData = await this.prisma.$queryRaw<any[]>`
                WITH ranked AS (
                    SELECT subject, grade, exam_name, exam_date,
                           ROW_NUMBER() OVER (PARTITION BY subject ORDER BY exam_date DESC) as rn
                    FROM sp_exam_score
                    WHERE student_id = ${member.studentId}
                      AND grade IS NOT NULL
                )
                SELECT subject,
                       MAX(CASE WHEN rn = 1 THEN grade END) as current_grade,
                       MAX(CASE WHEN rn = 2 THEN grade END) as previous_grade,
                       MAX(CASE WHEN rn = 1 THEN exam_name END) as current_exam,
                       MAX(CASE WHEN rn = 2 THEN exam_name END) as previous_exam
                FROM ranked
                WHERE rn <= 2
                GROUP BY subject
            `;

            let totalGrowthScore = 0;
            const recentImprovements = [];

            for (const row of examData) {
                if (row.previous_grade && row.current_grade) {
                    const result = this.calculateGrowthScore(row.previous_grade, row.current_grade);
                    totalGrowthScore += result.growthScore;
                    if (result.improvement > 0) {
                        recentImprovements.push({
                            subject: row.subject,
                            previousGrade: row.previous_grade,
                            currentGrade: row.current_grade,
                            previousExam: row.previous_exam,
                            currentExam: row.current_exam,
                            ...result,
                        });
                    }
                }
            }

            return {
                memberId,
                arenaId,
                currentGrowthScore: totalGrowthScore,
                recentImprovements,
                message: recentImprovements.length > 0
                    ? `${recentImprovements.length}개 과목에서 성장이 확인되었습니다!`
                    : '아직 비교할 성적 데이터가 부족합니다.',
            };
        } catch {
            return {
                memberId,
                arenaId,
                currentGrowthScore: 0,
                recentImprovements: [],
                message: 'StudyPlanner 성적 데이터 연동 대기 중입니다.',
            };
        }
    }

    /** 아레나 멤버들의 성장 점수 랭킹 */
    async getGrowthRanking(arenaId: number) {
        const members = await this.prisma.arenaMember.findMany({
            where: { arenaId: BigInt(arenaId), isActive: true },
        });

        const rankings = [];
        for (const member of members) {
            const result = await this.getMemberGrowthScore(Number(member.id), arenaId);
            rankings.push({
                memberId: Number(member.id),
                studentId: Number(member.studentId),
                nickname: `member-${Number(member.id)}`,
                growthScore: result.currentGrowthScore,
                improvements: result.recentImprovements.length,
            });
        }

        rankings.sort((a, b) => b.growthScore - a.growthScore);

        return {
            arenaId,
            rankings,
        };
    }

    /** 성장률 비교 (이전 시즌 vs 현재) */
    calculateGrowthRate(previousScores: number[], currentScores: number[]): number {
        if (previousScores.length === 0 || currentScores.length === 0) return 0;

        const prevAvg = previousScores.reduce((a, b) => a + b, 0) / previousScores.length;
        const currAvg = currentScores.reduce((a, b) => a + b, 0) / currentScores.length;

        if (prevAvg === 0) return 0;
        return Math.round(((currAvg - prevAvg) / prevAvg) * 100 * 100) / 100; // %
    }

    private getBaseMultiplier(previousGrade: number): number {
        // 낮은 등급에서 올라올수록 높은 보상
        const multipliers: Record<number, number> = {
            9: 2.0, 8: 1.8, 7: 1.6, 6: 1.4,
            5: 1.2, 4: 1.0, 3: 0.8, 2: 0.6,
        };
        return multipliers[previousGrade] || 1.0;
    }

    /** 학습 스트릭 계산 (연속 학습 일수) */
    async getStudyStreak(memberId: number, arenaId: number) {
        // 최근 60일간의 스냅샷 조회
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 60);

        const snapshots = await this.prisma.dailySnapshot.findMany({
            where: {
                memberId: BigInt(memberId),
                arenaId: BigInt(arenaId),
                date: { gte: limitDate },
            },
            orderBy: { date: 'desc' },
        });

        if (snapshots.length === 0) {
            return { streak: 0 };
        }

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 어제 날짜
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // 가장 최근기록 확인
        const lastRecordDate = new Date(snapshots[0].date);

        // 오늘 기록이 있거나, 어제 기록이 있어야 스트릭 유지 가능
        // 오늘 기록이 없어도 어제 기록이 있으면 스트릭은 깨지지 않았음 (오늘 공부 중일 수 있으니)
        const diffDays = Math.floor((today.getTime() - lastRecordDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            // 마지막 기록이 그저께 이전이면 스트릭 끊김
            return { streak: 0 };
        }

        // 연속성 체크
        let checks = diffDays === 0 ? 0 : 0; // 오늘부터 체크 (오늘 기록 없으면 어제부터 체크해야 하지만, 루프에서 처리)

        // 오늘 기록이 있으면 streak=1로 시작, 아니면 streak=0으로 시작하되 어제부터 찾음
        // 더 정확한 알고리즘:
        // 날짜를 집합(Set)으로 만들어서 연속된 날짜 확인

        const studyDates = new Set(snapshots
            .filter(s => s.totalStudyMin > 0 || s.completedMissions > 0) // 유효 학습 기준
            .map(s => s.date.toISOString().split('T')[0])
        );

        let currentCheck = new Date(yesterday); // 어제부터 역순 체크

        // 오늘 공부했으면 +1
        if (studyDates.has(today.toISOString().split('T')[0])) {
            streak++;
        }

        // 어제부터 역순으로 끊길 때까지 체크
        while (true) {
            const dateStr = currentCheck.toISOString().split('T')[0];
            if (studyDates.has(dateStr)) {
                streak++;
                currentCheck.setDate(currentCheck.getDate() - 1);
            } else {
                break;
            }
        }

        return { streak };
    }
}
