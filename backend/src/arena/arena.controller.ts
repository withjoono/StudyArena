import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ArenaService } from './arena.service';

@Controller('arena')
@UseGuards(AuthGuard('jwt'))
export class ArenaController {
    constructor(private readonly arenaService: ArenaService) { }

    /**
     * 아레나 생성
     */
    @Post()
    async createArena(
        @Req() req: Request,
        @Body() body: { name: string; description?: string },
    ) {
        const user = (req as any).user;
        const memberId = parseInt(user.jti, 10);
        return this.arenaService.createArena(memberId, body.name, body.description);
    }

    /**
     * 내가 속한 아레나 목록
     */
    @Get()
    async getMyArenas(@Req() req: Request) {
        const user = (req as any).user;
        const memberId = parseInt(user.jti, 10);
        return this.arenaService.getMyArenas(memberId);
    }

    /**
     * 아레나 상세 정보
     */
    @Get(':id')
    async getArenaDetail(@Param('id') id: string) {
        return this.arenaService.getArenaDetail(parseInt(id, 10));
    }

    /**
     * 내 멤버십 조회 (및 AuthMember 동기화)
     */
    @Get(':id/membership')
    async getMyMembership(@Req() req: Request, @Param('id') arenaId: string) {
        const user = (req as any).user;
        const hubMemberId = parseInt(user.jti, 10);
        return this.arenaService.getMyMembership(parseInt(arenaId, 10), hubMemberId);
    }

    /**
     * 초대 코드로 아레나 참여
     */
    @Post('join')
    async joinArena(
        @Req() req: Request,
        @Body() body: { inviteCode: string; studentId?: number },
    ) {
        const user = (req as any).user;
        const hubMemberId = parseInt(user.jti, 10);
        const studentId = body.studentId || hubMemberId;
        return this.arenaService.joinArena(body.inviteCode, studentId, hubMemberId);
    }

    /**
     * 아레나 탈퇴
     */
    @Delete(':id/leave')
    async leaveArena(@Req() req: Request, @Param('id') id: string) {
        const user = (req as any).user;
        const hubMemberId = parseInt(user.jti, 10);
        return this.arenaService.leaveArena(parseInt(id, 10), hubMemberId);
    }
}
