import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        });
    }

    async onModuleInit() {
        if (!process.env.DATABASE_URL) {
            this.logger.warn('DATABASE_URL is not set. Database connection skipped.');
            return;
        }

        try {
            await this.$connect();
            this.logger.log('Arena database connected successfully');
        } catch (error) {
            this.logger.error('Failed to connect to arena database:', error);
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
