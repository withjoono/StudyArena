import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Trophy, Plus, UserPlus, Swords, LogIn, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../stores';

export default function Layout() {
    const location = useLocation();
    const { setAuth, isLoggedIn } = useAuthStore();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('accessToken') || params.get('token');
        const refreshToken = params.get('refreshToken');

        if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
            setAuth(accessToken, null);
            window.history.replaceState({}, '', location.pathname);
        }
    }, [setAuth]);

    const navItems = isLoggedIn ? [
        { path: '/', label: '대시보드', icon: Trophy },
        { path: '/arena/create', label: 'Arena 만들기', icon: Plus },
        { path: '/arena/join', label: '참여하기', icon: UserPlus },
        { path: '/ranking', label: '랭킹', icon: BarChart3 },
    ] : [
        { path: '/', label: '홈', icon: Swords },
        { path: 'http://localhost:3000/login', label: '로그인', icon: LogIn },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* 헤더 그라디언트 — from-arena-500 to-arena-600 */}
            <header className="sticky top-0 z-50 bg-gradient-to-r from-arena-50 to-arena-600 shadow-lg shadow-arena-500/20">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Swords className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">StudyArena</span>
                    </Link>

                    <nav className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            const isExternal = item.path.startsWith('http');

                            if (isExternal) {
                                return (
                                    <a
                                        key={item.path}
                                        href={item.path}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-arena-100 hover:bg-white/10 hover:text-white transition-all duration-200"
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden sm:inline">{item.label}</span>
                                    </a>
                                );
                            }

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-white/20 text-white'
                                        : 'text-arena-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6">
                <Outlet />
            </main>
        </div>
    );
}
