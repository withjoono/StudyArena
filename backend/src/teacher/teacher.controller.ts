import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TeacherService } from './teacher.service';

@Controller('teacher')
@UseGuards(AuthGuard('jwt'))
export class TeacherController {
    constructor(private readonly teacherService: TeacherService) { }

    @Get('overview')
    async getArenaOverview(@Query('arenaId') arenaId: string) {
        return this.teacherService.getArenaOverview(parseInt(arenaId, 10));
    }

    @Get('member')
    async getMemberDetail(
        @Query('arenaId') arenaId: string,
        @Query('memberId') memberId: string,
    ) {
        return this.teacherService.getMemberDetail(
            parseInt(arenaId, 10),
            parseInt(memberId, 10),
        );
    }

    @Get('low-participation')
    async getLowParticipation(
        @Query('arenaId') arenaId: string,
        @Query('days') days?: string,
    ) {
        return this.teacherService.getLowParticipationMembers(
            parseInt(arenaId, 10),
            days ? parseInt(days, 10) : 3,
        );
    }

    @Get('weekly-report')
    async getWeeklyClassReport(@Query('arenaId') arenaId: string) {
        return this.teacherService.getWeeklyClassReport(parseInt(arenaId, 10));
    }
}
