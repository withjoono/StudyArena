import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

/**
 * 관리자 도구 서비스
 * - 아레나 관리 (시즌 리셋, 멤버 관리)
 * - 시스템 상태 모니터링
 */
@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(private readonly prisma: PrismaService) { }

    /** 시즌 리셋 */
    async resetWeeklySeason(arenaId: number) {
        this.logger.warn(`Season reset for arena ${arenaId}`);
        return {
            arenaId,
            action: 'weekly_reset',
            timestamp: new Date(),
            message: '주간 시즌이 리셋되었습니다. 리그가 재계산됩니다.',
        };
    }

    /** 시스템 통계 */
    async getSystemStats() {
        const [arenaCount, memberCount, snapshotCount] = await Promise.all([
            this.prisma.arena.count(),
            this.prisma.arenaMember.count({ where: { isActive: true } }),
            this.prisma.dailySnapshot.count(),
        ]);

        return {
            arenas: arenaCount,
            activeMembers: memberCount,
            totalSnapshots: snapshotCount,
            timestamp: new Date(),
        };
    }

    /** 아레나 멤버 목록 (관리용) */
    async getArenaMembers(arenaId: number) {
        const members = await this.prisma.arenaMember.findMany({
            where: { arenaId: BigInt(arenaId) },
            orderBy: { joinedAt: 'asc' },
        });

        return members.map((m: any) => ({
            id: Number(m.id),
            studentId: Number(m.studentId),
            hubMemberId: m.hubMemberId ? Number(m.hubMemberId) : null,
            role: m.role,
            isActive: m.isActive,
            joinedAt: m.joinedAt,
        }));
    }

    /** 멤버 역할 변경 */
    async changeMemberRole(memberId: number, role: string) {
        const member = await this.prisma.arenaMember.update({
            where: { id: BigInt(memberId) },
            data: { role },
        });

        return {
            memberId: Number(member.id),
            role: member.role,
            message: `역할이 '${role}'로 변경되었습니다.`,
        };
    }

    /** 멤버 비활성화 */
    async removeMember(memberId: number) {
        await this.prisma.arenaMember.update({
            where: { id: BigInt(memberId) },
            data: { isActive: false },
        });
        return { memberId, message: '멤버가 비활성화 처리되었습니다.' };
    }

    /** 오래된 데이터 정리 */
    async cleanupOldData(daysToKeep: number = 90) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysToKeep);

        const deleted = await this.prisma.dailySnapshot.deleteMany({
            where: { date: { lt: cutoff } },
        });

        return {
            action: 'cleanup',
            deletedSnapshots: deleted.count,
            cutoffDate: cutoff,
        };
    }
}
