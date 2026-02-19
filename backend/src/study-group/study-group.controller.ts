import { Controller, Post, Body, Get, Param, Query, UseGuards } from '@nestjs/common';
import { StudyGroupService } from './study-group.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { SnapshotService } from '../snapshot/snapshot.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('study-group')
@UseGuards(AuthGuard('jwt'))
export class StudyGroupController {
    constructor(
        private readonly studyGroupService: StudyGroupService,
        private readonly leaderboardService: LeaderboardService,
        private readonly snapshotService: SnapshotService,
    ) { }

    @Post()
    async createGroup(@CurrentUser() user: any, @Body('name') name: string) {
        return this.studyGroupService.createGroup(user.hubId, name);
    }

    @Get()
    async getMyGroups(@CurrentUser() user: any) {
        return this.studyGroupService.getMyGroups(user.hubId);
    }

    @Get(':id')
    async getGroupDetails(@CurrentUser() user: any, @Param('id') id: string) {
        return this.studyGroupService.getGroupDetails(user.hubId, id);
    }

    @Get(':id/leaderboard')
    async getLeaderboard(
        @Param('id') id: string,
        @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
    ) {
        return this.leaderboardService.getLeaderboard(Number(id), period);
    }

    @Get(':id/statistics')
    async getStatistics(
        @Param('id') id: string,
        @Query('period') period: 'daily' | 'weekly' | 'monthly' = 'daily',
    ) {
        return this.snapshotService.getStatistics(Number(id), period);
    }

    @Post(':id/invite')
    async generateInviteCode(@CurrentUser() user: any, @Param('id') id: string) {
        return this.studyGroupService.generateInviteCode(user.hubId, id);
    }

    @Post('join')
    async joinGroup(@CurrentUser() user: any, @Body('code') code: string) {
        return this.studyGroupService.joinGroup(user.hubId, code);
    }

    @Post(':id/comment')
    async addComment(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Body() body: { targetMemberId: string; targetDate: string; content: string }
    ) {
        return this.studyGroupService.addComment(user.hubId, id, body);
    }

    @Get(':id/comments')
    async getComments(
        @CurrentUser() user: any,
        @Param('id') id: string,
        @Query('date') date: string
    ) {
        return this.studyGroupService.getComments(user.hubId, id, date);
    }
}
