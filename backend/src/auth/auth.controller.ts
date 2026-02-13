import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './services/auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('sso/exchange')
    async exchangeSSOCode(@Body('code') code: string) {
        return this.authService.exchangeSSOCode(code);
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    getProfile(@Req() req: Request) {
        return (req as any).user;
    }
}
