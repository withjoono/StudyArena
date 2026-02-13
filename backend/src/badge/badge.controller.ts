import { Controller, Get, Post, Query, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BadgeService } from './badge.service';

@Controller('badge')
@UseGuards(AuthGuard('jwt'))
export class BadgeController {
    constructor(private readonly badgeService: BadgeService) { }

    @Get()
    async getAllBadges() {
        return this.badgeService.getAllBadges();
    }

    @Post('seed')
    async seedBadges() {
        return this.badgeService.seedBadges();
    }

    @Get('my')
    async getMyBadges(@Query('memberId') memberId: string) {
        return this.badgeService.getMyBadges(parseInt(memberId, 10));
    }

    @Post(':code/award')
    async awardBadge(
        @Param('code') code: string,
        @Query('memberId') memberId: string,
        @Query('arenaId') arenaId: string,
    ) {
        return this.badgeService.awardBadge(
            parseInt(memberId, 10), code, parseInt(arenaId, 10),
        );
    }
}
