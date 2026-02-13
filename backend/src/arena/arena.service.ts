import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';

@Injectable()
export class ArenaService {
    private readonly logger = new Logger(ArenaService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * 초대 코드 생성 (6자리 영숫자)
     */
    private generateInviteCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // O, 0, 1, I 제외
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * 아레나 코드 생성
     */
    private async generateArenaCode(): Promise<string> {
        const count = await this.prisma.arena.count();
        return `AR${String(count + 1).padStart(5, '0')}`;
    }

    /**
     * 아레나 생성
     */
    async createArena(ownerId: number, name: string, description?: string) {
        const arenaCode = await this.generateArenaCode();
        let inviteCode = this.generateInviteCode();

        // 초대 코드 중복 확인
        let exists = await this.prisma.arena.findUnique({ where: { inviteCode } });
        while (exists) {
            inviteCode = this.generateInviteCode();
            exists = await this.prisma.arena.findUnique({ where: { inviteCode } });
        }

        const arena = await this.prisma.arena.create({
            data: {
                arenaCode,
                name,
                description,
                ownerId: BigInt(ownerId),
                inviteCode,
            },
        });

        // 생성자를 owner로 자동 추가
        await this.prisma.arenaMember.create({
            data: {
                arenaId: arena.id,
                studentId: BigInt(ownerId),
                hubMemberId: BigInt(ownerId),
                role: 'owner',
            },
        });

        return this.serializeArena(arena);
    }

    /**
     * 내가 속한 아레나 목록
     */
    async getMyArenas(memberId: number) {
        const memberships = await this.prisma.arenaMember.findMany({
            where: {
                hubMemberId: BigInt(memberId),
                isActive: true,
            },
            include: {
                arena: {
                    include: {
                        _count: {
                            select: { members: { where: { isActive: true } } },
                        },
                    },
                },
            },
        });

        return memberships.map((m) => ({
            id: Number(m.arena.id),
            arenaCode: m.arena.arenaCode,
            name: m.arena.name,
            description: m.arena.description,
            inviteCode: m.arena.inviteCode,
            role: m.role,
            memberCount: m.arena._count.members,
            joinedAt: m.joinedAt,
        }));
    }

    /**
     * 아레나 상세 (멤버 목록 포함)
     */
    async getArenaDetail(arenaId: number) {
        const arena = await this.prisma.arena.findUnique({
            where: { id: BigInt(arenaId) },
            include: {
                members: {
                    where: { isActive: true },
                    orderBy: { joinedAt: 'asc' },
                },
            },
        });

        if (!arena) {
            throw new NotFoundException('아레나를 찾을 수 없습니다.');
        }

        return {
            id: Number(arena.id),
            arenaCode: arena.arenaCode,
            name: arena.name,
            description: arena.description,
            inviteCode: arena.inviteCode,
            maxMembers: arena.maxMembers,
            isActive: arena.isActive,
            createdAt: arena.createdAt,
            members: arena.members.map((m) => ({
                id: Number(m.id),
                studentId: Number(m.studentId),
                hubMemberId: m.hubMemberId ? Number(m.hubMemberId) : null,
                role: m.role,
                joinedAt: m.joinedAt,
            })),
        };
    }

    /**
     * 초대 코드로 아레나 참여
     */
    async joinArena(inviteCode: string, studentId: number, hubMemberId: number) {
        const arena = await this.prisma.arena.findUnique({
            where: { inviteCode },
            include: {
                _count: {
                    select: { members: { where: { isActive: true } } },
                },
            },
        });

        if (!arena) {
            throw new NotFoundException('유효하지 않은 초대 코드입니다.');
        }

        if (!arena.isActive) {
            throw new ConflictException('비활성화된 아레나입니다.');
        }

        if (arena._count.members >= arena.maxMembers) {
            throw new ConflictException('아레나 정원이 가득 찼습니다.');
        }

        // 이미 참여 여부 확인
        const existing = await this.prisma.arenaMember.findUnique({
            where: {
                uk_sa_arena_member: {
                    arenaId: arena.id,
                    studentId: BigInt(studentId),
                },
            },
        });

        if (existing) {
            if (existing.isActive) {
                throw new ConflictException('이미 참여한 아레나입니다.');
            }
            // 비활성 멤버 재활성화
            await this.prisma.arenaMember.update({
                where: { id: existing.id },
                data: { isActive: true, joinedAt: new Date() },
            });
            return { message: '아레나에 다시 참여했습니다.', arenaId: Number(arena.id) };
        }

        await this.prisma.arenaMember.create({
            data: {
                arenaId: arena.id,
                studentId: BigInt(studentId),
                hubMemberId: BigInt(hubMemberId),
                role: 'member',
            },
        });

        return { message: '아레나에 참여했습니다.', arenaId: Number(arena.id) };
    }

    /**
     * 아레나 탈퇴
     */
    async leaveArena(arenaId: number, hubMemberId: number) {
        const member = await this.prisma.arenaMember.findFirst({
            where: {
                arenaId: BigInt(arenaId),
                hubMemberId: BigInt(hubMemberId),
                isActive: true,
            },
        });

        if (!member) {
            throw new NotFoundException('아레나 멤버가 아닙니다.');
        }

        if (member.role === 'owner') {
            throw new ConflictException('소유자는 아레나를 탈퇴할 수 없습니다. 아레나를 삭제하세요.');
        }

        await this.prisma.arenaMember.update({
            where: { id: member.id },
            data: { isActive: false },
        });

        return { message: '아레나에서 탈퇴했습니다.' };
    }

    private serializeArena(arena: any) {
        return {
            id: Number(arena.id),
            arenaCode: arena.arenaCode,
            name: arena.name,
            description: arena.description,
            inviteCode: arena.inviteCode,
            maxMembers: arena.maxMembers,
            isActive: arena.isActive,
            createdAt: arena.createdAt,
        };
    }
}
