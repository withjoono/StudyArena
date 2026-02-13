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

    /** 멤버의 성장 점수 계산 (외부 데이터 기반) */
    async getMemberGrowthScore(memberId: number, arenaId: number) {
        // StudyArena에는 성적 데이터가 없으므로
        // StudyPlanner API에서 데이터를 가져오거나, 크로스앱 데이터 테이블을 사용
        // Phase 3에서는 아레나 기반 더미 데이터로 시연

        return {
            memberId,
            arenaId,
            currentGrowthScore: 0,
            recentImprovements: [],
            message: 'StudyPlanner 연동 후 성적 데이터가 반영됩니다.',
        };
    }

    /** 아레나 멤버들의 성장 점수 랭킹 */
    async getGrowthRanking(arenaId: number) {
        // 크로스앱 연동 시 StudyPlanner에서 성적 데이터를 가져와서 계산
        // 현재는 placeholder
        return {
            arenaId,
            rankings: [],
            message: '성적 데이터 연동 후 활성화됩니다.',
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
}
