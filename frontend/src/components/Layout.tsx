import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Swords, Menu, LogIn } from 'lucide-react';
import { useAuthStore } from '../stores';
import { cn } from '../lib/utils';
import { Footer } from './footer';
import { redirectToLogin, logout } from '../lib/auth';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as SeparatorPrimitive from '@radix-ui/react-separator';

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

    const navItems = [
        { path: '/', label: '대시보드' },
        { path: '/study-group', label: '스터디그룹' },
        { path: '/arena/create', label: 'Arena 만들기' },
        { path: '/arena/join', label: '참여하기' },
        { path: '/ranking', label: '랭킹' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* ─── Header (Susi/Jungsi 스타일) ─── */}
            <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
                <div className="mx-auto">
                    <div className="container flex h-14 w-full items-center justify-between px-4 lg:h-16">
                        {/* Logo */}
                        <Link to="/" className="flex shrink-0 items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-arena-500 lg:h-12 lg:w-12">
                                <Swords className="h-5 w-5 text-white lg:h-6 lg:w-6" />
                            </div>
                            <span className="text-base font-medium text-primary lg:text-lg">StudyArena</span>
                        </Link>

                        {/* ─── Mobile hamburger ─── */}
                        <button
                            className="flex lg:hidden px-2"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Menu</span>
                        </button>

                        {/* ─── Mobile side sheet (overlay) ─── */}
                        {mobileOpen && (
                            <div className="fixed inset-0 z-50 lg:hidden">
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 bg-black/50"
                                    onClick={() => setMobileOpen(false)}
                                />
                                {/* Sheet */}
                                <div className="fixed inset-y-0 left-0 w-[300px] bg-white shadow-xl sm:w-[360px] overflow-y-auto">
                                    <div className="flex items-center gap-3 border-b p-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-arena-500">
                                            <Swords className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="text-base font-medium text-primary">StudyArena</span>
                                        <button
                                            className="ml-auto text-gray-400 hover:text-gray-600 text-xl"
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <nav className="flex flex-col gap-1 p-4">
                                        {isLoggedIn ? (
                                            <>
                                                {navItems.map((item) => (
                                                    <Link
                                                        key={item.path}
                                                        to={item.path}
                                                        onClick={() => setMobileOpen(false)}
                                                        className={cn(
                                                            'flex h-10 items-center rounded-md px-3 text-sm font-medium hover:bg-gray-100',
                                                            location.pathname === item.path && 'bg-gray-100 text-arena-500'
                                                        )}
                                                    >
                                                        {item.label}
                                                    </Link>
                                                ))}
                                                <SeparatorPrimitive.Root className="my-2 h-px bg-gray-200" />
                                                <button
                                                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                                                    className="flex h-10 items-center rounded-md px-3 text-sm font-medium text-red-500 hover:bg-gray-100"
                                                >
                                                    로그아웃
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <Link
                                                    to="/"
                                                    onClick={() => setMobileOpen(false)}
                                                    className="flex h-10 items-center rounded-md px-3 text-sm font-medium hover:bg-gray-100"
                                                >
                                                    🏠 홈
                                                </Link>
                                                <Link
                                                    to="/study-group"
                                                    onClick={() => setMobileOpen(false)}
                                                    className="flex h-10 items-center rounded-md px-3 text-sm font-medium hover:bg-gray-100"
                                                >
                                                    스터디그룹
                                                </Link>
                                                <SeparatorPrimitive.Root className="my-2 h-px bg-gray-200" />
                                                <button
                                                    onClick={() => { setMobileOpen(false); redirectToLogin(); }}
                                                    className="flex h-10 w-full items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
                                                >
                                                    로그인
                                                </button>
                                            </>
                                        )}
                                    </nav>
                                </div>
                            </div>
                        )}

                        {/* ─── Desktop nav ─── */}
                        <div className="hidden items-center gap-4 lg:flex">
                            {isLoggedIn ? (
                                <>
                                    {/* Nav links as Popover dropdown */}
                                    <PopoverPrimitive.Root>
                                        <PopoverPrimitive.Trigger asChild>
                                            <button className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                                                메뉴
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                        </PopoverPrimitive.Trigger>
                                        <PopoverPrimitive.Portal>
                                            <PopoverPrimitive.Content
                                                className="z-50 w-48 rounded-md border bg-white p-1 shadow-md"
                                                sideOffset={5}
                                            >
                                                {navItems.map((item) => (
                                                    <Link
                                                        key={item.path}
                                                        to={item.path}
                                                        className={cn(
                                                            'flex h-8 w-full items-center rounded-md px-2 text-sm hover:bg-gray-100',
                                                            location.pathname === item.path && 'text-arena-500 font-medium'
                                                        )}
                                                    >
                                                        {item.label}
                                                    </Link>
                                                ))}
                                            </PopoverPrimitive.Content>
                                        </PopoverPrimitive.Portal>
                                    </PopoverPrimitive.Root>

                                    {/* User profile dropdown */}
                                    <PopoverPrimitive.Root>
                                        <PopoverPrimitive.Trigger asChild>
                                            <button className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                                                내 정보
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                        </PopoverPrimitive.Trigger>
                                        <PopoverPrimitive.Portal>
                                            <PopoverPrimitive.Content
                                                className="z-50 w-48 rounded-md border bg-white p-1 shadow-md"
                                                sideOffset={5}
                                            >
                                                <Link to="/ranking" className="flex h-8 w-full items-center rounded-md px-2 text-sm hover:bg-gray-100">랭킹</Link>
                                                <SeparatorPrimitive.Root className="my-1 h-px bg-gray-200" />
                                                {/* Logout with Dialog confirmation */}
                                                <DialogPrimitive.Root open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                                                    <DialogPrimitive.Trigger asChild>
                                                        <button className="flex h-8 w-full items-center rounded-md px-2 text-sm font-normal text-red-500 hover:bg-gray-100">
                                                            로그아웃
                                                        </button>
                                                    </DialogPrimitive.Trigger>
                                                    <DialogPrimitive.Portal>
                                                        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
                                                        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-lg">
                                                            <DialogPrimitive.Title className="text-lg font-semibold">
                                                                로그아웃 하시겠습니까?
                                                            </DialogPrimitive.Title>
                                                            <DialogPrimitive.Description className="mt-2 text-sm text-gray-500">
                                                                로그아웃하면 다시 로그인해야 합니다.
                                                            </DialogPrimitive.Description>
                                                            <div className="mt-4 flex justify-end gap-3">
                                                                <DialogPrimitive.Close asChild>
                                                                    <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                                                                        취소
                                                                    </button>
                                                                </DialogPrimitive.Close>
                                                                <button
                                                                    onClick={handleLogout}
                                                                    className="rounded-md bg-arena-500 px-4 py-2 text-sm font-medium text-white hover:bg-arena-600"
                                                                >
                                                                    확인
                                                                </button>
                                                            </div>
                                                        </DialogPrimitive.Content>
                                                    </DialogPrimitive.Portal>
                                                </DialogPrimitive.Root>
                                            </PopoverPrimitive.Content>
                                        </PopoverPrimitive.Portal>
                                    </PopoverPrimitive.Root>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/study-group"
                                        className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                                    >
                                        스터디그룹
                                    </Link>
                                    <button
                                        onClick={redirectToLogin}
                                        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                    >
                                        <LogIn className="h-4 w-4" />
                                        로그인
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

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
