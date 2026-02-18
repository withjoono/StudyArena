import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, Bell, LogOut, Swords, Share2, CreditCard } from 'lucide-react';
import { useAuthStore } from '../stores';
import { cn } from '../lib/utils';
import { Footer } from './footer';
import { redirectToLogin, logout } from '../lib/auth';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as SeparatorPrimitive from '@radix-ui/react-separator';

// ───────────────────────── 메인 네비게이션 ─────────────────────────
const mainNavItems = [
    { path: '/', label: 'Arena 홈' },
    { path: '/study-group', label: '스터디그룹' },
    { path: '/arena/create', label: 'Arena 만들기' },
    { path: '/arena/join', label: '참여하기' },
    { path: '/ranking', label: '랭킹' },
];

export default function Layout() {
    const location = useLocation();
    const { setAuth, isLoggedIn, clearAuth } = useAuthStore();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

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

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        clearAuth();
        logout();
        setLogoutDialogOpen(false);
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* ─── Header (다크 테마 + Arena 레드 악센트) ─── */}
            <header className="sticky top-0 z-40 w-full bg-gray-900">
                <div className="mx-auto max-w-7xl flex h-14 items-center justify-between px-4 lg:h-16 lg:px-6">
                    {/* ─── Logo ─── */}
                    <Link to="/" className="flex shrink-0 items-center gap-2">
                        <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg bg-arena-500 flex items-center justify-center">
                            <Swords className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                        </div>
                        <span className="font-bold text-lg text-white lg:text-xl">Study Arena</span>
                    </Link>

                    {/* ─── Desktop Navigation (플랫 메인 메뉴) ─── */}
                    {isLoggedIn && (
                        <nav className="hidden lg:flex items-center gap-1">
                            {mainNavItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                        location.pathname === item.path
                                            ? 'text-arena-400 bg-arena-500/15'
                                            : 'text-white/80 hover:text-white hover:bg-white/10'
                                    )}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    )}

                    {/* ─── Desktop Right Section ─── */}
                    <div className="hidden lg:flex items-center gap-1">
                        {isLoggedIn ? (
                            <>
                                {/* 공유 */}
                                <button
                                    className="relative p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                                    title="공유"
                                >
                                    <Share2 className="h-5 w-5" />
                                </button>

                                {/* 결제 */}
                                <button
                                    className="relative p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                                    title="결제"
                                >
                                    <CreditCard className="h-5 w-5" />
                                </button>

                                {/* 알림 */}
                                <button
                                    className="relative p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                                    title="알림"
                                >
                                    <Bell className="h-5 w-5" />
                                </button>

                                {/* 로그아웃 Dialog */}
                                <DialogPrimitive.Root open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                                    <DialogPrimitive.Trigger asChild>
                                        <button
                                            className="ml-1 p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                                            title="로그아웃"
                                        >
                                            <LogOut className="h-5 w-5" />
                                        </button>
                                    </DialogPrimitive.Trigger>
                                    <DialogPrimitive.Portal>
                                        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
                                        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-6 shadow-2xl">
                                            <DialogPrimitive.Title className="text-lg font-bold">
                                                로그아웃 하시겠습니까?
                                            </DialogPrimitive.Title>
                                            <DialogPrimitive.Description className="mt-2 text-sm text-gray-500">
                                                로그아웃하면 다시 로그인해야 합니다.
                                            </DialogPrimitive.Description>
                                            <div className="mt-5 flex justify-end gap-3">
                                                <DialogPrimitive.Close asChild>
                                                    <button className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
                                                        취소
                                                    </button>
                                                </DialogPrimitive.Close>
                                                <button
                                                    onClick={handleLogout}
                                                    className="rounded-lg bg-arena-500 px-4 py-2 text-sm font-medium text-white hover:bg-arena-600 transition-colors"
                                                >
                                                    확인
                                                </button>
                                            </div>
                                        </DialogPrimitive.Content>
                                    </DialogPrimitive.Portal>
                                </DialogPrimitive.Root>
                            </>
                        ) : (
                            <button
                                onClick={redirectToLogin}
                                className="inline-flex items-center gap-2 rounded-full bg-arena-500 px-5 py-2 text-sm font-semibold text-white hover:bg-arena-600 transition-colors shadow-lg shadow-arena-500/30"
                            >
                                로그인
                            </button>
                        )}
                    </div>

                    {/* ─── Mobile hamburger ─── */}
                    <button
                        className="flex lg:hidden p-2 text-white/80 hover:text-white transition-colors"
                        onClick={() => setMobileOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Menu</span>
                    </button>
                </div>
            </header>

            {/* ─── Mobile side sheet (overlay) ─── */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    {/* Sheet */}
                    <div className="fixed inset-y-0 left-0 w-[300px] bg-gray-900 shadow-2xl sm:w-[340px] overflow-y-auto">
                        {/* Sheet Header */}
                        <div className="flex items-center gap-2 border-b border-white/10 p-4">
                            <div className="h-8 w-8 rounded-lg bg-arena-500 flex items-center justify-center">
                                <Swords className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-base font-bold text-white">Study Arena</span>
                            <button
                                className="ml-auto text-white/50 hover:text-white text-xl transition-colors"
                                onClick={() => setMobileOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <nav className="flex flex-col gap-1 p-4">
                            {/* 메인 메뉴 */}
                            {isLoggedIn ? (
                                <>
                                    {mainNavItems.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setMobileOpen(false)}
                                            className={cn(
                                                'flex h-10 items-center rounded-lg px-3 text-sm transition-colors',
                                                location.pathname === item.path
                                                    ? 'text-arena-400 bg-arena-500/10 font-medium'
                                                    : 'text-white/70 hover:text-white hover:bg-white/5'
                                            )}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}

                                    <SeparatorPrimitive.Root className="my-2 h-px bg-white/10" />

                                    {/* 모바일 아이콘 메뉴 */}
                                    <div className="flex items-center gap-2 px-3 py-2">
                                        <button className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="공유">
                                            <Share2 className="h-5 w-5" />
                                        </button>
                                        <button className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="결제">
                                            <CreditCard className="h-5 w-5" />
                                        </button>
                                        <button className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="알림">
                                            <Bell className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <SeparatorPrimitive.Root className="my-2 h-px bg-white/10" />

                                    <button
                                        onClick={() => { setMobileOpen(false); handleLogout(); }}
                                        className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        로그아웃
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => { setMobileOpen(false); redirectToLogin(); }}
                                    className="flex h-10 w-full items-center justify-center rounded-full bg-arena-500 text-sm font-semibold text-white hover:bg-arena-600 transition-colors shadow-lg shadow-arena-500/30"
                                >
                                    로그인
                                </button>
                            )}
                        </nav>
                    </div>
                </div>
            )}

            {/* ─── Main content ─── */}
            <main className="flex-1">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <Outlet />
                </div>
            </main>

            {/* ─── Footer ─── */}
            <Footer />
        </div>
    );
}
