import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ExamBattleService } from './exam-battle.service';

@Controller('exam-battle')
@UseGuards(AuthGuard('jwt'))
export class ExamBattleController {
    constructor(private readonly examBattleService: ExamBattleService) { }

    /**
     * 배틀 생성
     */
    @Post()
    async createBattle(
        @Req() req: Request,
        @Body() body: {
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
        const user = (req as any).user;
        return this.examBattleService.createBattle(user.jti, body);
    }

    /**
     * 내 배틀 목록
     */
    @Get('my')
    async getMyBattles(@Req() req: Request) {
        const user = (req as any).user;
        return this.examBattleService.getMyBattles(user.jti);
    }

    /**
     * 전적 조회
     */
    @Get('record/:memberId')
    async getRecord(@Param('memberId') memberId: string) {
        return this.examBattleService.getRecord(memberId);
    }

    /**
     * 내 전적 조회
     */
    @Get('record')
    async getMyRecord(@Req() req: Request) {
        const user = (req as any).user;
        return this.examBattleService.getRecord(user.jti);
    }

    /**
     * 배틀 코드로 조회
     */
    @Get('code/:code')
    async getBattleByCode(@Param('code') code: string) {
        return this.examBattleService.getBattleByCode(code);
    }

    /**
     * 배틀 ID로 조회
     */
    @Get(':id')
    async getBattleById(@Param('id') id: string) {
        return this.examBattleService.getBattleById(parseInt(id, 10));
    }

    /**
     * 배틀 수락
     */
    @Put(':id/accept')
    async acceptBattle(@Param('id') id: string, @Req() req: Request) {
        const user = (req as any).user;
        return this.examBattleService.acceptBattle(parseInt(id, 10), user.jti);
    }

    /**
     * 배틀 거절
     */
    @Put(':id/reject')
    async rejectBattle(@Param('id') id: string, @Req() req: Request) {
        const user = (req as any).user;
        return this.examBattleService.rejectBattle(parseInt(id, 10), user.jti);
    }

    /**
     * 배틀 시작
     */
    @Put(':id/start')
    async startBattle(@Param('id') id: string, @Req() req: Request) {
        const user = (req as any).user;
        return this.examBattleService.startBattle(parseInt(id, 10), user.jti);
    }

    /**
     * 점수 제출
     */
    @Post(':id/submit')
    async submitScore(
        @Param('id') id: string,
        @Req() req: Request,
        @Body() body: {
            rawScore?: number;
            standardScore?: number;
            grade?: number;
            percentile?: number;
            timeTakenMin?: number;
        },
    ) {
        const user = (req as any).user;
        return this.examBattleService.submitScore(parseInt(id, 10), user.jti, body);
    }
}
