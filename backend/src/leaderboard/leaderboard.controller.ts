import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
@UseGuards(AuthGuard('jwt'))
export class LeaderboardController {
    constructor(private readonly leaderboardService: LeaderboardService) { }

    /**
     * 아레나 리더보드 조회
     * GET /leaderboard/:arenaId?period=daily|weekly|monthly
     */
    @Get(':arenaId')
    async getLeaderboard(
        @Param('arenaId') arenaId: string,
        @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
    ) {
        return this.leaderboardService.getLeaderboard(parseInt(arenaId, 10), period);
    }

    /**
     * 내 랭킹 조회
     * GET /leaderboard/:arenaId/me?period=daily|weekly|monthly
     */
    @Get(':arenaId/me')
    async getMyRanking(
        @Req() req: Request,
        @Param('arenaId') arenaId: string,
        @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
    ) {
        const user = (req as any).user;
        const hubMemberId = parseInt(user.jti, 10);
        return this.leaderboardService.getMyRanking(parseInt(arenaId, 10), hubMemberId, period);
    }
}
