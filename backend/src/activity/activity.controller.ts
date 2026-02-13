import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActivityService } from './activity.service';

@Controller('activity')
@UseGuards(AuthGuard('jwt'))
export class ActivityController {
    constructor(private readonly activityService: ActivityService) { }

    /** 하트비트 (접속 상태 유지) */
    @Post('heartbeat')
    heartbeat(
        @Body() body: { memberId: number; arenaId: number; subject?: string },
    ) {
        return this.activityService.heartbeat(body);
    }

    /** 아레나 온라인 멤버 */
    @Get('arena/:arenaId/online')
    getOnlineMembers(@Param('arenaId') arenaId: string) {
        return this.activityService.getOnlineMembers(parseInt(arenaId, 10));
    }

    /** 응원 보내기 */
    @Post('cheer')
    async sendCheer(
        @Body() body: {
            arenaId: number;
            senderId: number;
            receiverId: number;
            type?: string;
            message?: string;
        },
    ) {
        return this.activityService.sendCheer(body);
    }

    /** 내가 받은 응원 */
    @Get('cheer/received')
    async getReceivedCheers(
        @Query('receiverId') receiverId: string,
        @Query('limit') limit?: string,
    ) {
        return this.activityService.getReceivedCheers(
            parseInt(receiverId, 10),
            limit ? parseInt(limit, 10) : 20,
        );
    }

    /** 오늘 보낸 응원 수 */
    @Get('cheer/count')
    async getTodayCheerCount(@Query('senderId') senderId: string) {
        return this.activityService.getTodayCheerCount(parseInt(senderId, 10));
    }
}
