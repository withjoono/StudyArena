import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class AuthService {
    async exchangeSSOCode(code: string) {
        const hubApiUrl = process.env.HUB_API_URL || 'http://localhost:4000';
        const serviceId = process.env.SERVICE_ID || 'studyarena';

        try {
            const response = await fetch(`${hubApiUrl}/auth/sso/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, serviceId }),
            });

            if (!response.ok) {
                throw new HttpException('SSO verification failed', HttpStatus.UNAUTHORIZED);
            }

            const result = await response.json();
            const data = result.data || result;

            if (data.accessToken) {
                return {
                    success: true,
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                };
            }

            throw new HttpException('Invalid SSO response', HttpStatus.BAD_REQUEST);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException('Hub SSO service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
}
