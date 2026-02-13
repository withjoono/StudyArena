import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppPermission, PermissionsPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtHelperService {
    constructor(private readonly jwtService: JwtService) { }

    getAppPermission(token: string, appId: string): AppPermission | undefined {
        try {
            const payload = this.jwtService.decode(token) as any;
            return payload?.permissions?.[appId];
        } catch {
            return undefined;
        }
    }

    getAllPermissions(token: string): PermissionsPayload | undefined {
        try {
            const payload = this.jwtService.decode(token) as any;
            return payload?.permissions;
        } catch {
            return undefined;
        }
    }

    verifyToken(token: string): boolean {
        try {
            this.jwtService.verify(token);
            return true;
        } catch {
            return false;
        }
    }
}
