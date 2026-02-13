/**
 * Hub JWT 토큰에 포함된 앱별 권한 정보
 */
export type AppPermission = {
    plan: 'free' | 'basic' | 'premium' | 'none';
    expires?: string;
    features?: string[];
};

/**
 * Hub JWT 토큰에 포함된 전체 권한 정보
 */
export type PermissionsPayload = Record<string, AppPermission>;

export type JwtPayloadType = {
    jti: string; // JWT ID (Hub memberId)
    sub: string; // Subject ('ATK' | 'RTK')
    iat: number; // Issued At
    exp: number; // Expiration Time
    email?: string;
    permissions?: PermissionsPayload;
};
