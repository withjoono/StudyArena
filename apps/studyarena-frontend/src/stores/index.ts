import { create } from 'zustand';

interface AuthState {
    accessToken: string | null;
    user: any | null;
    isLoggedIn: boolean;
    setAuth: (token: string, user: any) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: localStorage.getItem('accessToken'),
    user: null,
    isLoggedIn: !!localStorage.getItem('accessToken'),
    setAuth: (token, user) => {
        localStorage.setItem('accessToken', token);
        set({ accessToken: token, user, isLoggedIn: true });
    },
    clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ accessToken: null, user: null, isLoggedIn: false });
    },
}));

interface ArenaState {
    selectedPeriod: 'daily' | 'weekly' | 'monthly';
    setPeriod: (period: 'daily' | 'weekly' | 'monthly') => void;
}

export const useArenaStore = create<ArenaState>((set) => ({
    selectedPeriod: 'daily',
    setPeriod: (period) => set({ selectedPeriod: period }),
}));
