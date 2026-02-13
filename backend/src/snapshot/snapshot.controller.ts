import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SnapshotService } from './snapshot.service';

@Controller('snapshot')
@UseGuards(AuthGuard('jwt'))
export class SnapshotController {
    constructor(private readonly snapshotService: SnapshotService) { }

    /**
     * 아레나 통계 데이터 (차트용)
     * GET /snapshot/:arenaId/stats?period=daily|weekly|monthly
     */
    @Get(':arenaId/stats')
    async getStatistics(
        @Param('arenaId') arenaId: string,
        @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
    ) {
        return this.snapshotService.getStatistics(parseInt(arenaId, 10), period);
    }
}
