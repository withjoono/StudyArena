import { Controller, Get, Post, Put, Delete, Query, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('stats')
    async getSystemStats() {
        return this.adminService.getSystemStats();
    }

    @Post('season-reset')
    async resetWeeklySeason(@Query('arenaId') arenaId: string) {
        return this.adminService.resetWeeklySeason(parseInt(arenaId, 10));
    }

    @Get('members')
    async getArenaMembers(@Query('arenaId') arenaId: string) {
        return this.adminService.getArenaMembers(parseInt(arenaId, 10));
    }

    @Put('member/:id/role')
    async changeMemberRole(
        @Param('id') id: string,
        @Query('role') role: string,
    ) {
        return this.adminService.changeMemberRole(parseInt(id, 10), role);
    }

    @Delete('member/:id')
    async removeMember(@Param('id') id: string) {
        return this.adminService.removeMember(parseInt(id, 10));
    }

    @Post('cleanup')
    async cleanupOldData(@Query('days') days?: string) {
        return this.adminService.cleanupOldData(
            days ? parseInt(days, 10) : 90,
        );
    }
}
