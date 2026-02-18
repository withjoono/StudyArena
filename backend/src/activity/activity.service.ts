import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ArenaGateway } from '../realtime/arena.gateway';

@Injectable()
export class ActivityService {
    private readonly logger = new Logger(ActivityService.name);

    // 인메모리 접속 상태 (Phase 3에서 Redis로 이관)
    private onlineMembers = new Map<string, {
        memberId: number;
        arenaId: number;
        subject: string;
        lastHeartbeat: Date;
    }>();

    constructor(
        private readonly prisma: PrismaService,
        @Optional() private readonly gateway?: ArenaGateway,
    ) {
        // 1분마다 오프라인 멤버 정리
        setInterval(() => this.cleanupOffline(), 60_000);
    }

    /** 하트비트 전송 (접속 상태 유지) */
    heartbeat(data: { memberId: number; arenaId: number; subject?: string }) {
        const key = `${data.arenaId}:${data.memberId}`;
        this.onlineMembers.set(key, {
            memberId: data.memberId,
            arenaId: data.arenaId,
            subject: data.subject || '학습 중',
            lastHeartbeat: new Date(),
        });
        return { status: 'ok' };
    }

    /** 아레나 내 접속 중인 멤버 */
    getOnlineMembers(arenaId: number) {
        const result: any[] = [];
        for (const [, val] of this.onlineMembers) {
            if (val.arenaId === arenaId) {
                result.push({
                    memberId: val.memberId,
                    subject: val.subject,
                    since: val.lastHeartbeat,
                });
            }
        }
        return result;
    }

    /** 응원 보내기 + WebSocket 실시간 알림 */
    async sendCheer(data: {
        arenaId: number;
        senderId: string;
        receiverId: string;
        type?: string;
        message?: string;
    }) {
        const cheer = await this.prisma.cheer.create({
            data: {
                arenaId: BigInt(data.arenaId),
                senderId: data.senderId,
                receiverId: data.receiverId,
                type: data.type || 'fire',
                message: data.message,
            },
        });

        const result = {
            id: Number(cheer.id),
            arenaId: Number(cheer.arenaId),
            senderId: cheer.senderId,
            receiverId: cheer.receiverId,
            type: cheer.type,
            message: cheer.message,
            createdAt: cheer.createdAt,
        };

        // 실시간 WebSocket 알림
        if (this.gateway) {
            this.gateway.emitCheerReceived(data.arenaId, {
                senderId: data.senderId,
                receiverId: data.receiverId,
                type: data.type || 'fire',
                message: data.message,
            });
        }

        return result;
    }

    /** 내가 받은 응원 조회 */
    async getReceivedCheers(receiverId: string, limit = 20) {
        const cheers = await this.prisma.cheer.findMany({
            where: { receiverId: receiverId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return cheers.map((c: any) => ({
            id: Number(c.id),
            senderId: c.senderId,
            type: c.type,
            message: c.message,
            createdAt: c.createdAt,
        }));
    }

    /** 오늘 보낸 응원 수 */
    async getTodayCheerCount(senderId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const count = await this.prisma.cheer.count({
            where: {
                senderId: senderId,
                createdAt: { gte: today },
            },
        });

        return { count, limit: 10 }; // 하루 10회 제한
    }

    private cleanupOffline() {
        const cutoff = Date.now() - 2 * 60_000; // 2분 이상 하트비트 없으면 오프라인
        for (const [key, val] of this.onlineMembers) {
            if (val.lastHeartbeat.getTime() < cutoff) {
                this.onlineMembers.delete(key);
            }
        }
    }
}
