import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class StudyGroupService {
    constructor(private prisma: PrismaService) { }

    async createGroup(hubId: string, name: string) {
        // Create basic group (Arena with type STUDY_GROUP)
        const arenaCode = 'SG-' + randomBytes(4).toString('hex').toUpperCase();
        const inviteCode = randomBytes(3).toString('hex').toUpperCase();

        const group = await this.prisma.arena.create({
            data: {
                name,
                arenaCode,
                inviteCode,
                ownerId: hubId,
                // @ts-ignore
                type: 'STUDY_GROUP',
                members: {
                    create: {
                        studentId: hubId,
                        hubMemberId: hubId,
                        role: 'admin',
                        authMemberId: `sa_${hubId}` // Ensure authMember exists or created
                    }
                }
            }
        });

        return { ...group, id: group.id.toString(), ownerId: group.ownerId.toString() };
    }

    async getMyGroups(hubId: string) {
        const members = await this.prisma.arenaMember.findMany({
            where: {
                hubMemberId: hubId,
                arena: {
                    // @ts-ignore
                    type: 'STUDY_GROUP',
                    isActive: true
                }
            },
            include: {
                arena: true
            }
        });

        return members.map((m: any) => ({
            ...m.arena,
            id: m.arena.id.toString(),
            ownerId: m.arena.ownerId.toString(),
            joinedAt: m.joinedAt
        }));
    }

    async getGroupDetails(hubId: string, groupId: string) {
        // Verify membership
        const member = await this.prisma.arenaMember.findFirst({
            where: {
                arenaId: BigInt(groupId),
                hubMemberId: hubId
            }
        });

        if (!member) throw new ForbiddenException('Not a member of this group');

        const group = await this.prisma.arena.findUnique({
            where: { id: BigInt(groupId) },
            include: {
                members: {
                    include: {
                        authMember: true,
                        snapshots: {
                            take: 7, // Last 7 days for stats
                            orderBy: { date: 'desc' }
                        }
                    }
                }
            }
        });

        if (!group) throw new NotFoundException('Group not found');

        return {
            ...group,
            id: group.id.toString(),
            ownerId: group.ownerId.toString(),
            members: group.members.map((m: any) => ({
                id: m.id.toString(),
                hubMemberId: m.hubMemberId?.toString(),
                nickname: m.authMember?.nickname || 'Unknown',
                role: m.role,
                snapshots: m.snapshots.map((s: any) => ({
                    date: s.date,
                    totalStudyMin: s.totalStudyMin,
                    achievementPct: s.achievementPct
                }))
            }))
        };
    }

    async generateInviteCode(hubId: string, groupId: string) {
        const group = await this.prisma.arena.findUnique({
            where: { id: BigInt(groupId) },
            select: { ownerId: true, inviteCode: true }
        });

        if (!group) throw new NotFoundException('Group not found');
        if (group.ownerId !== hubId) throw new ForbiddenException('Only owner can invite');

        return { inviteCode: group.inviteCode };
    }

    async joinGroup(hubId: string, code: string) {
        // @ts-ignore
        const group = await this.prisma.arena.findUnique({
            where: { inviteCode: code, type: 'STUDY_GROUP' }
        });

        if (!group) throw new NotFoundException('Group not found');

        // Check if already member
        const existing = await this.prisma.arenaMember.findFirst({
            where: {
                arenaId: group.id,
                hubMemberId: hubId
            }
        });

        if (existing) throw new BadRequestException('Already a member');

        // Join
        await this.prisma.arenaMember.create({
            data: {
                arenaId: group.id,
                hubMemberId: hubId,
                studentId: hubId,
                role: 'member',
                authMemberId: `sa_${hubId}`
            }
        });

        return { success: true, groupId: group.id.toString() };
    }

    async addComment(hubId: string, groupId: string, data: { targetMemberId: string; targetDate: string; content: string }) {
        // Verify writer membership
        const writer = await this.prisma.arenaMember.findFirst({
            where: {
                arenaId: BigInt(groupId),
                hubMemberId: hubId
            }
        });

        if (!writer) throw new ForbiddenException('Not a group member');

        // @ts-ignore
        return this.prisma.studyGroupComment.create({
            data: {
                arenaId: BigInt(groupId),
                writerId: writer.id,
                targetMemberId: BigInt(data.targetMemberId),
                targetDate: new Date(data.targetDate),
                content: data.content
            }
        });
    }

    async getComments(hubId: string, groupId: string, date: string) {
        // Verify membership
        const member = await this.prisma.arenaMember.findFirst({
            where: {
                arenaId: BigInt(groupId),
                hubMemberId: hubId
            }
        });

        if (!member) throw new ForbiddenException('Not a member');

        // @ts-ignore
        const comments = await this.prisma.studyGroupComment.findMany({
            where: {
                arenaId: BigInt(groupId),
                targetDate: date ? new Date(date) : undefined
            },
            include: {
                writer: {
                    include: { authMember: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return comments.map((c: any) => ({
            id: c.id.toString(),
            content: c.content,
            createdAt: c.createdAt,
            writerName: c.writer.authMember?.nickname,
            writerId: c.writer.hubMemberId?.toString()
        }));
    }
}
