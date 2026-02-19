import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class ExamBattleService {
    private readonly logger = new Logger(ExamBattleService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * 배틀 코드 생성 (8자리)
     */
    private generateBattleCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * 배틀 생성 (초대)
     */
    async createBattle(
        challengerId: string,
        data: {
            opponentId?: string;
            opponentNickname?: string;
            examType: string;
            examName: string;
            examId?: number;
            betEnabled?: boolean;
            betAmount?: number;
            betDescription?: string;
            timeLimitMin?: number;
        },
    ) {
        let battleCode = this.generateBattleCode();
        let exists = await this.prisma.examBattle.findUnique({ where: { battleCode } });
        while (exists) {
            battleCode = this.generateBattleCode();
            exists = await this.prisma.examBattle.findUnique({ where: { battleCode } });
        }

        const battle = await this.prisma.examBattle.create({
            data: {
                battleCode,
                challengerId,
                opponentId: data.opponentId || null,
                opponentNickname: data.opponentNickname || null,
                status: 'pending',
                examType: data.examType,
                examName: data.examName,
                examId: data.examId || null,
                betEnabled: data.betEnabled || false,
                betAmount: data.betAmount || null,
                betDescription: data.betDescription || null,
                timeLimitMin: data.timeLimitMin || 90,
            },
        });

        // 신청자의 결과 레코드 미리 생성
        await this.prisma.battleResult.create({
            data: {
                battleId: battle.id,
                participantId: challengerId,
            },
        });

        return this.serializeBattle(battle);
    }

    /**
     * 배틀 코드로 상세 조회
     */
    async getBattleByCode(code: string) {
        const battle = await this.prisma.examBattle.findUnique({
            where: { battleCode: code },
            include: { results: true },
        });

        if (!battle) {
            throw new NotFoundException('배틀을 찾을 수 없습니다.');
        }

        return this.serializeBattleWithResults(battle);
    }

    /**
     * 배틀 ID로 상세 조회
     */
    async getBattleById(id: number) {
        const battle = await this.prisma.examBattle.findUnique({
            where: { id: BigInt(id) },
            include: { results: true },
        });

        if (!battle) {
            throw new NotFoundException('배틀을 찾을 수 없습니다.');
        }

        return this.serializeBattleWithResults(battle);
    }

    /**
     * 배틀 수락
     */
    async acceptBattle(battleId: number, memberId: string) {
        const battle = await this.prisma.examBattle.findUnique({
            where: { id: BigInt(battleId) },
        });

        if (!battle) {
            throw new NotFoundException('배틀을 찾을 수 없습니다.');
        }

        if (battle.status !== 'pending') {
            throw new ConflictException('이미 처리된 배틀입니다.');
        }

        if (battle.challengerId === memberId) {
            throw new BadRequestException('자신의 배틀은 수락할 수 없습니다.');
        }

        const updated = await this.prisma.examBattle.update({
            where: { id: BigInt(battleId) },
            data: {
                opponentId: memberId,
                status: 'accepted',
            },
        });

        // 상대방 결과 레코드 생성
        await this.prisma.battleResult.create({
            data: {
                battleId: updated.id,
                participantId: memberId,
            },
        });

        return this.serializeBattle(updated);
    }

    /**
     * 배틀 거절/취소
     */
    async rejectBattle(battleId: number, memberId: string) {
        const battle = await this.prisma.examBattle.findUnique({
            where: { id: BigInt(battleId) },
        });

        if (!battle) {
            throw new NotFoundException('배틀을 찾을 수 없습니다.');
        }

        if (battle.status !== 'pending' && battle.status !== 'accepted') {
            throw new ConflictException('취소할 수 없는 상태입니다.');
        }

        const updated = await this.prisma.examBattle.update({
            where: { id: BigInt(battleId) },
            data: { status: 'cancelled' },
        });

        return this.serializeBattle(updated);
    }

    /**
     * 배틀 시작 (타이머 시작)
     */
    async startBattle(battleId: number, memberId: string) {
        const battle = await this.prisma.examBattle.findUnique({
            where: { id: BigInt(battleId) },
        });

        if (!battle) {
            throw new NotFoundException('배틀을 찾을 수 없습니다.');
        }

        if (battle.status !== 'accepted') {
            throw new ConflictException('수락된 배틀만 시작할 수 있습니다.');
        }

        if (battle.challengerId !== memberId && battle.opponentId !== memberId) {
            throw new BadRequestException('배틀 참가자만 시작할 수 있습니다.');
        }

        const updated = await this.prisma.examBattle.update({
            where: { id: BigInt(battleId) },
            data: {
                status: 'in_progress',
                startTime: new Date(),
            },
        });

        return this.serializeBattle(updated);
    }

    /**
     * 점수 제출
     */
    async submitScore(
        battleId: number,
        memberId: string,
        data: {
            rawScore?: number;
            standardScore?: number;
            grade?: number;
            percentile?: number;
            timeTakenMin?: number;
        },
    ) {
        const battle = await this.prisma.examBattle.findUnique({
            where: { id: BigInt(battleId) },
            include: { results: true },
        });

        if (!battle) {
            throw new NotFoundException('배틀을 찾을 수 없습니다.');
        }

        if (battle.status !== 'in_progress' && battle.status !== 'accepted') {
            throw new ConflictException('점수를 제출할 수 없는 상태입니다.');
        }

        // 참가자 결과 업데이트
        const result = await this.prisma.battleResult.upsert({
            where: {
                uk_sa_battle_result: {
                    battleId: BigInt(battleId),
                    participantId: memberId,
                },
            },
            update: {
                rawScore: data.rawScore,
                standardScore: data.standardScore,
                grade: data.grade,
                percentile: data.percentile,
                timeTakenMin: data.timeTakenMin,
                submittedAt: new Date(),
            },
            create: {
                battleId: BigInt(battleId),
                participantId: memberId,
                rawScore: data.rawScore,
                standardScore: data.standardScore,
                grade: data.grade,
                percentile: data.percentile,
                timeTakenMin: data.timeTakenMin,
                submittedAt: new Date(),
            },
        });

        // 양쪽 다 제출했는지 확인
        const allResults = await this.prisma.battleResult.findMany({
            where: { battleId: BigInt(battleId) },
        });

        const allSubmitted = allResults.length >= 2 && allResults.every(r => r.submittedAt !== null);

        if (allSubmitted) {
            // 승자 결정 & 배틀 완료
            await this.finalizeBattle(battleId, allResults);
        }

        return { message: '점수가 제출되었습니다.', submitted: allSubmitted };
    }

    /**
     * 배틀 완료 처리 (승패 결정 + 전적 업데이트)
     */
    private async finalizeBattle(battleId: number, results: any[]) {
        // rawScore 기준으로 승자 결정
        const sorted = [...results].sort((a, b) => {
            const scoreA = Number(a.rawScore || 0);
            const scoreB = Number(b.rawScore || 0);
            return scoreB - scoreA;
        });

        const isDraw = Number(sorted[0].rawScore || 0) === Number(sorted[1].rawScore || 0);

        for (const r of sorted) {
            const isWinner = isDraw ? null : r.id === sorted[0].id;
            await this.prisma.battleResult.update({
                where: { id: r.id },
                data: { isWinner: isDraw ? null : isWinner },
            });
        }

        // 배틀 완료 처리
        await this.prisma.examBattle.update({
            where: { id: BigInt(battleId) },
            data: { status: 'completed', endTime: new Date() },
        });

        // 전적 업데이트
        for (const r of results) {
            const isWinner = isDraw ? null : r.id === sorted[0].id;
            await this.updateRecord(r.participantId, Number(r.rawScore || 0), isWinner, isDraw);
        }
    }

    /**
     * 전적 업데이트
     */
    private async updateRecord(memberId: string, score: number, isWinner: boolean | null, isDraw: boolean) {
        const record = await this.prisma.battleRecord.upsert({
            where: { memberId },
            update: {
                totalBattles: { increment: 1 },
                wins: isWinner === true ? { increment: 1 } : undefined,
                losses: isWinner === false ? { increment: 1 } : undefined,
                draws: isDraw ? { increment: 1 } : undefined,
                currentStreak: isWinner === true ? { increment: 1 } : 0,
            },
            create: {
                memberId,
                totalBattles: 1,
                wins: isWinner === true ? 1 : 0,
                losses: isWinner === false ? 1 : 0,
                draws: isDraw ? 1 : 0,
                winRate: isWinner === true ? 100 : 0,
                avgScore: score,
                bestScore: score,
                currentStreak: isWinner === true ? 1 : 0,
                maxStreak: isWinner === true ? 1 : 0,
            },
        });

        // 승률 & 최고점 재계산
        const fresh = await this.prisma.battleRecord.findUnique({ where: { memberId } });
        if (fresh) {
            const total = fresh.totalBattles || 1;
            const winRate = (fresh.wins / total) * 100;
            const newBest = Math.max(Number(fresh.bestScore), score);
            const newMax = Math.max(fresh.maxStreak, fresh.currentStreak);
            await this.prisma.battleRecord.update({
                where: { memberId },
                data: { winRate, bestScore: newBest, maxStreak: newMax },
            });
        }
    }

    /**
     * 내 배틀 목록
     */
    async getMyBattles(memberId: string) {
        const battles = await this.prisma.examBattle.findMany({
            where: {
                OR: [
                    { challengerId: memberId },
                    { opponentId: memberId },
                ],
            },
            include: { results: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return battles.map(b => this.serializeBattleWithResults(b));
    }

    /**
     * 전적 조회
     */
    async getRecord(memberId: string) {
        const record = await this.prisma.battleRecord.findUnique({
            where: { memberId },
        });

        if (!record) {
            return {
                memberId,
                totalBattles: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                winRate: 0,
                avgScore: 0,
                bestScore: 0,
                currentStreak: 0,
                maxStreak: 0,
            };
        }

        return {
            memberId: record.memberId,
            totalBattles: record.totalBattles,
            wins: record.wins,
            losses: record.losses,
            draws: record.draws,
            winRate: Number(record.winRate),
            avgScore: Number(record.avgScore),
            bestScore: Number(record.bestScore),
            currentStreak: record.currentStreak,
            maxStreak: record.maxStreak,
        };
    }

    // ─── Serializers ───

    private serializeBattle(battle: any) {
        return {
            id: Number(battle.id),
            battleCode: battle.battleCode,
            challengerId: battle.challengerId,
            opponentId: battle.opponentId,
            opponentNickname: battle.opponentNickname,
            status: battle.status,
            examType: battle.examType,
            examId: battle.examId,
            examName: battle.examName,
            betEnabled: battle.betEnabled,
            betAmount: battle.betAmount,
            betDescription: battle.betDescription,
            startTime: battle.startTime,
            endTime: battle.endTime,
            timeLimitMin: battle.timeLimitMin,
            createdAt: battle.createdAt,
        };
    }

    private serializeBattleWithResults(battle: any) {
        return {
            ...this.serializeBattle(battle),
            results: (battle.results || []).map((r: any) => ({
                id: Number(r.id),
                participantId: r.participantId,
                participantNickname: r.participantNickname,
                rawScore: r.rawScore ? Number(r.rawScore) : null,
                standardScore: r.standardScore,
                grade: r.grade,
                percentile: r.percentile,
                isWinner: r.isWinner,
                submittedAt: r.submittedAt,
                timeTakenMin: r.timeTakenMin,
            })),
        };
    }
}
