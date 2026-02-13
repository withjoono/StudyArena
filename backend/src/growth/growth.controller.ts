import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GrowthService } from './growth.service';

@Controller('growth')
@UseGuards(AuthGuard('jwt'))
export class GrowthController {
    constructor(private readonly growthService: GrowthService) { }

    @Get('score')
    async getMemberGrowthScore(
        @Query('memberId') memberId: string,
        @Query('arenaId') arenaId: string,
    ) {
        return this.growthService.getMemberGrowthScore(
            parseInt(memberId, 10),
            parseInt(arenaId, 10),
        );
    }

    @Get('ranking')
    async getGrowthRanking(@Query('arenaId') arenaId: string) {
        return this.growthService.getGrowthRanking(parseInt(arenaId, 10));
    }

    @Get('calculate')
    async calculateGrowth(
        @Query('previousGrade') prev: string,
        @Query('currentGrade') curr: string,
    ) {
        return this.growthService.calculateGrowthScore(
            parseInt(prev, 10),
            parseInt(curr, 10),
        );
    }
}
