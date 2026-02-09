import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtHelperService } from '../services/jwt-helper.service';
import { REQUIRED_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { AppPermission } from '../types/jwt-payload.type';

@Injectable()
export class HubPermissionGuard implements CanActivate {
    private readonly APP_ID = 'studyarena';

    constructor(
        private reflector: Reflector,
        private jwtHelperService: JwtHelperService,
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredFeature = this.reflector.getAllAndOverride<string>(REQUIRED_FEATURE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredFeature) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractToken(request);

        if (!token) {
            throw new ForbiddenException('권한이 없습니다. 로그인이 필요합니다.');
        }

        try {
            const permission = this.jwtHelperService.getAppPermission(token, this.APP_ID);

            if (!permission) {
                throw new ForbiddenException(`${this.APP_ID} 앱에 대한 권한이 없습니다.`);
            }

            if (this.isExpired(permission)) {
                throw new ForbiddenException('구독이 만료되었습니다.');
            }

            if (!this.hasFeature(permission, requiredFeature)) {
                throw new ForbiddenException(`'${requiredFeature}' 기능을 사용할 권한이 없습니다.`);
            }

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            throw new ForbiddenException('권한 확인에 실패했습니다.');
        }
    }

    private extractToken(request: Request): string | undefined {
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return request.cookies?.access_token;
    }

    private isExpired(permission: AppPermission): boolean {
        if (!permission.expires) {
            return false;
        }
        return new Date(permission.expires) < new Date();
    }

    private hasFeature(permission: AppPermission, feature: string): boolean {
        if (permission.plan === 'none') {
            return false;
        }
        if (!permission.features) {
            return true;
        }
        return permission.features.includes(feature);
    }
}
