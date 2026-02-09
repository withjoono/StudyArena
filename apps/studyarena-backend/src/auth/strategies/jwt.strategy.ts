import { Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import { JwtPayloadType } from '../types/jwt-payload.type';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(configService: ConfigService<AllConfigType>) {
        const authConfig = configService.get('auth', { infer: true });
        const secret = authConfig?.secret || 'studyarena-secret-key-change-in-production';
        super({
            jwtFromRequest: JwtStrategy.extractJwtFromRequestOrCookie,
            secretOrKey: secret,
        });
    }

    private static extractJwtFromRequestOrCookie(req: Request): string | null {
        const authHeader = req.headers?.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        if (req.cookies?.access_token) {
            return req.cookies.access_token;
        }
        return null;
    }

    public validate(payload: JwtPayloadType): JwtPayloadType | never {
        if (!payload.jti) {
            throw new UnauthorizedException('Invalid token payload');
        }
        return payload;
    }
}
