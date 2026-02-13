import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface ConnectedClient {
    memberId: number;
    arenaId: number;
    subject?: string;
}

/**
 * 실시간 WebSocket 게이트웨이
 * - 순위 변동 알림
 * - 응원 수신 알림
 * - 아레나 공동체 알림 ("오늘 목표 달성률 40%")
 */
@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/arena',
})
export class ArenaGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(ArenaGateway.name);
    private connectedClients = new Map<string, ConnectedClient>();

    afterInit() {
        this.logger.log('Arena WebSocket Gateway initialized');
    }

    handleConnection(client: Socket) {
        this.logger.debug(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        const clientData = this.connectedClients.get(client.id);
        if (clientData) {
            // 아레나 룸에서 퇴장 알림
            this.server
                .to(`arena:${clientData.arenaId}`)
                .emit('memberOffline', { memberId: clientData.memberId });
            this.connectedClients.delete(client.id);
        }
        this.logger.debug(`Client disconnected: ${client.id}`);
    }

    /** 아레나 입장 */
    @SubscribeMessage('joinArena')
    handleJoinArena(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { memberId: number; arenaId: number; subject?: string },
    ) {
        const roomName = `arena:${data.arenaId}`;
        client.join(roomName);

        this.connectedClients.set(client.id, {
            memberId: data.memberId,
            arenaId: data.arenaId,
            subject: data.subject,
        });

        // 다른 멤버들에게 알림
        client.to(roomName).emit('memberOnline', {
            memberId: data.memberId,
            subject: data.subject || '학습 중',
        });

        this.logger.log(`Member ${data.memberId} joined arena ${data.arenaId}`);
        return { event: 'joinedArena', data: { arenaId: data.arenaId } };
    }

    /** 아레나 퇴장 */
    @SubscribeMessage('leaveArena')
    handleLeaveArena(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { arenaId: number },
    ) {
        client.leave(`arena:${data.arenaId}`);
        this.connectedClients.delete(client.id);
        return { event: 'leftArena', data: { arenaId: data.arenaId } };
    }

    /** 학습 과목 업데이트 */
    @SubscribeMessage('updateSubject')
    handleUpdateSubject(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { subject: string },
    ) {
        const clientData = this.connectedClients.get(client.id);
        if (clientData) {
            clientData.subject = data.subject;
            this.server
                .to(`arena:${clientData.arenaId}`)
                .emit('subjectUpdated', {
                    memberId: clientData.memberId,
                    subject: data.subject,
                });
        }
    }

    // =====================================
    // 서버 → 클라이언트 이벤트 전송 메서드
    // (다른 서비스에서 호출)
    // =====================================

    /** 순위 변동 알림 */
    emitRankChange(arenaId: number, data: {
        memberId: number;
        oldRank: number;
        newRank: number;
        change: number;
    }) {
        this.server.to(`arena:${arenaId}`).emit('rankChange', data);
    }

    /** 응원 수신 알림 */
    emitCheerReceived(arenaId: number, data: {
        senderId: number;
        receiverId: number;
        type: string;
        message?: string;
    }) {
        this.server.to(`arena:${arenaId}`).emit('cheerReceived', data);
    }

    /** 공동체 알림 */
    emitCommunityAlert(arenaId: number, message: string) {
        this.server.to(`arena:${arenaId}`).emit('communityAlert', {
            message,
            timestamp: new Date(),
        });
    }

    /** 목표 달성률 알림 */
    emitAchievementRate(arenaId: number, rate: number) {
        const message = `현재 우리 아레나 오늘 목표 달성률 ${Math.round(rate)}%입니다. ${rate >= 80 ? '대단해요! 🎉' : rate >= 50 ? '힘내세요! 💪' : '함께 화이팅! 🔥'}`;
        this.emitCommunityAlert(arenaId, message);
    }

    /** 아레나 접속자 수 */
    getOnlineCount(arenaId: number): number {
        let count = 0;
        for (const [, client] of this.connectedClients) {
            if (client.arenaId === arenaId) count++;
        }
        return count;
    }
}
