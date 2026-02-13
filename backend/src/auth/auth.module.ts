import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtHelperService } from './services/jwt-helper.service';
import { HubPermissionGuard } from './guards/hub-permission.guard';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('AUTH_SECRET') || 'studyarena-secret-key-change-in-production',
                signOptions: {
                    expiresIn: '2h',
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, JwtHelperService, HubPermissionGuard],
    exports: [PassportModule, JwtModule, JwtHelperService, HubPermissionGuard],
})
export class AuthModule { }
