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
        // Hub JWT는 base64로 인코딩된 시크릿을 Buffer.from(secret, 'base64')로 디코딩하여 서명
        const secretBase64 = process.env.AUTH_SECRET || 'studyarena-secret-key-change-in-production';
        const decodedSecret = Buffer.from(secretBase64, 'base64');
        console.log(`[JwtStrategy] AUTH_SECRET loaded: length=${secretBase64.length}, decoded=${decodedSecret.length}bytes, first4chars=${secretBase64.substring(0, 4)}`);
        super({
            jwtFromRequest: JwtStrategy.extractJwtFromRequestOrCookie,
            secretOrKey: decodedSecret,
            algorithms: ['HS512'], // Hub JWT는 HS512로 서명됨
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
