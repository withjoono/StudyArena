import { Controller, Get, Post, Query, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { LeagueService } from './league.service';

@Controller('league')
@UseGuards(AuthGuard('jwt'))
export class LeagueController {
    constructor(private readonly leagueService: LeagueService) { }

    /** 리그 목록 조회 */
    @Get()
    async getLeagues() {
        return this.leagueService.getLeagues();
    }

    /** 리그 시드 데이터 생성 */
    @Post('seed')
    async seedLeagues() {
        return this.leagueService.seedLeagues();
    }

    /** 내 현재 리그 */
    @Get(':arenaId/me')
    async getMyLeague(
        @Req() req: Request,
        @Param('arenaId') arenaId: string,
    ) {
        const user = (req as any).user;
        const hubMemberId = parseInt(user.jti, 10);
        return this.leagueService.getMyLeague(parseInt(arenaId, 10), hubMemberId);
    }

    /** 리그별 리더보드 */
    @Get(':arenaId/leaderboard')
    async getLeagueLeaderboard(
        @Param('arenaId') arenaId: string,
        @Query('tier') tier?: string,
    ) {
        return this.leagueService.getLeagueLeaderboard(parseInt(arenaId, 10), tier);
    }

    /** 수동 리그 계산 트리거 */
    @Post(':arenaId/calculate')
    async calculateLeagues(@Param('arenaId') arenaId: string) {
        return this.leagueService.calculateWeeklyLeagues(parseInt(arenaId, 10));
    }
}
