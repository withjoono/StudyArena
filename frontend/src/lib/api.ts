import axios from 'axios';

// 개발환경: Vite proxy로 /api → localhost:4006, 프로덕션: 실제 백엔드 URL
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // 토큰이 만료되었거나 무효한 경우 로컬 토큰 정리 (자동 리다이렉트 안 함)
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
        return Promise.reject(error);
    },
);

// Arena API
export const arenaApi = {
    getMyArenas: () => api.get('/arena'),
    getArenaDetail: (id: number) => api.get(`/arena/${id}`),
    createArena: (data: { name: string; description?: string }) =>
        api.post('/arena', data),
    joinArena: (inviteCode: string) =>
        api.post('/arena/join', { inviteCode }),
    leaveArena: (id: number) => api.delete(`/arena/${id}/leave`),
    getMyMembership: (id: number) => api.get(`/arena/${id}/membership`),
};

// Leaderboard API
export const leaderboardApi = {
    getLeaderboard: (arenaId: number, period: 'daily' | 'weekly' | 'monthly' = 'daily') =>
        api.get(`/leaderboard/${arenaId}`, { params: { period } }),
    getMyRanking: (arenaId: number, period: 'daily' | 'weekly' | 'monthly' = 'daily') =>
        api.get(`/leaderboard/${arenaId}/me`, { params: { period } }),
};

// Snapshot / Statistics API
export const snapshotApi = {
    getStatistics: (arenaId: number, period: 'daily' | 'weekly' | 'monthly' = 'daily') =>
        api.get(`/snapshot/${arenaId}/stats`, { params: { period } }),
};

// League API
export const leagueApi = {
    getLeagues: () => api.get('/league'),
    seedLeagues: () => api.post('/league/seed'),
    getMyLeague: (arenaId: number) => api.get(`/league/${arenaId}/me`),
    getLeagueLeaderboard: (arenaId: number, tier?: string) =>
        api.get(`/league/${arenaId}/leaderboard`, { params: { tier } }),
    calculateLeagues: (arenaId: number) => api.post(`/league/${arenaId}/calculate`),
};

// Activity / Cheer API
export const activityApi = {
    heartbeat: (memberId: number, arenaId: number, subject?: string) =>
        api.post('/activity/heartbeat', { memberId, arenaId, subject }),
    getOnlineMembers: (arenaId: number) =>
        api.get(`/activity/arena/${arenaId}/online`),
    sendCheer: (data: { arenaId: number; senderId: number; receiverId: number; type?: string; message?: string }) =>
        api.post('/activity/cheer', data),
    getReceivedCheers: (receiverId: number, limit?: number) =>
        api.get('/activity/cheer/received', { params: { receiverId, limit } }),
    getTodayCheerCount: (senderId: number) =>
        api.get('/activity/cheer/count', { params: { senderId } }),
};

// Badge API
export const badgeApi = {
    getAll: () => api.get('/badge'),
    seedBadges: () => api.post('/badge/seed'),
    getMyBadges: (memberId: number) =>
        api.get('/badge/my', { params: { memberId } }),
    awardBadge: (code: string, memberId: number, arenaId: number) =>
        api.post(`/badge/${code}/award`, null, { params: { memberId, arenaId } }),
};

// Growth API
export const growthApi = {
    getScore: (memberId: number, arenaId: number) =>
        api.get('/growth/score', { params: { memberId, arenaId } }),
    getRanking: (arenaId: number) =>
        api.get('/growth/ranking', { params: { arenaId } }),
    calculate: (previousGrade: number, currentGrade: number) =>
        api.get('/growth/calculate', { params: { previousGrade, currentGrade } }),
    getStreak: (memberId: number, arenaId: number) =>
        api.get('/growth/streak', { params: { memberId, arenaId } }),
};

// Ranking API (Redis-backed)
export const rankingApi = {
    getTop: (arenaId: number, n?: number, period?: string) =>
        api.get('/ranking/top', { params: { arenaId, n, period } }),
    getNearby: (arenaId: number, memberId: number, period?: string) =>
        api.get('/ranking/nearby', { params: { arenaId, memberId, period } }),
    getLeagueRanking: (arenaId: number, tier: string, n?: number) =>
        api.get('/ranking/league', { params: { arenaId, tier, n } }),
};

// Teacher API
export const teacherApi = {
    getOverview: (arenaId: number) =>
        api.get('/teacher/overview', { params: { arenaId } }),
    getMemberDetail: (arenaId: number, memberId: number) =>
        api.get('/teacher/member', { params: { arenaId, memberId } }),
    getLowParticipation: (arenaId: number, days?: number) =>
        api.get('/teacher/low-participation', { params: { arenaId, days } }),
    getWeeklyReport: (arenaId: number) =>
        api.get('/teacher/weekly-report', { params: { arenaId } }),
};

// Admin API
export const adminApi = {
    getStats: () => api.get('/admin/stats'),
    resetSeason: (arenaId: number) =>
        api.post('/admin/season-reset', null, { params: { arenaId } }),
    getMembers: (arenaId: number) =>
        api.get('/admin/members', { params: { arenaId } }),
    changeRole: (memberId: number, role: string) =>
        api.put(`/admin/member/${memberId}/role`, null, { params: { role } }),
    removeMember: (memberId: number) =>
        api.delete(`/admin/member/${memberId}`),
    cleanup: (days?: number) =>
        api.post('/admin/cleanup', null, { params: { days } }),
};

// Exam Battle API
export const examBattleApi = {
    create: (data: {
        opponentId?: string;
        opponentNickname?: string;
        examType: string;
        examName: string;
        examId?: number;
        betEnabled?: boolean;
        betAmount?: number;
        betDescription?: string;
        timeLimitMin?: number;
    }) => api.post('/exam-battle', data),
    getMyBattles: () => api.get('/exam-battle/my'),
    getMyRecord: () => api.get('/exam-battle/record'),
    getRecord: (memberId: string) => api.get(`/exam-battle/record/${memberId}`),
    getBattleByCode: (code: string) => api.get(`/exam-battle/code/${code}`),
    getBattleById: (id: number) => api.get(`/exam-battle/${id}`),
    accept: (id: number) => api.put(`/exam-battle/${id}/accept`),
    reject: (id: number) => api.put(`/exam-battle/${id}/reject`),
    start: (id: number) => api.put(`/exam-battle/${id}/start`),
    submitScore: (id: number, data: {
        rawScore?: number;
        standardScore?: number;
        grade?: number;
        percentile?: number;
        timeTakenMin?: number;
    }) => api.post(`/exam-battle/${id}/submit`, data),
};

export default api;
