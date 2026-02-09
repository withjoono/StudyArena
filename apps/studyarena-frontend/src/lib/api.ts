import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
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
            // Redirect to Hub login
            const hubUrl = 'http://localhost:3000';
            const redirectUrl = encodeURIComponent(window.location.href);
            window.location.href = `${hubUrl}/login?redirect=${redirectUrl}`;
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
};

// Leaderboard API
export const leaderboardApi = {
    getLeaderboard: (arenaId: number, period: 'daily' | 'weekly' | 'monthly' = 'daily') =>
        api.get(`/leaderboard/${arenaId}`, { params: { period } }),
    getMyRanking: (arenaId: number, period: 'daily' | 'weekly' | 'monthly' = 'daily') =>
        api.get(`/leaderboard/${arenaId}/me`, { params: { period } }),
};

export default api;
