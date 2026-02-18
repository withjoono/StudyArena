import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, LogIn, Bell, Users, ChevronDown, LogOut, Swords } from 'lucide-react';
import { useAuthStore } from '../stores';
import { cn } from '../lib/utils';
import { Footer } from './footer';
import { redirectToLogin, logout } from '../lib/auth';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as PopoverPrimitive from '@radix-ui/react-popover';

// ───────────────────────── 외부 서비스 URL ─────────────────────────
const HUB_URL = import.meta.env.VITE_HUB_URL || 'http://localhost:3000';
const SUSI_URL = import.meta.env.VITE_SUSI_URL || 'http://localhost:3001';
const JUNGSI_URL = import.meta.env.VITE_JUNGSI_URL || 'http://localhost:3002';
const MYEXAM_URL = import.meta.env.VITE_MYEXAM_URL || 'http://localhost:3003';
const STUDYPLANNER_URL = import.meta.env.VITE_STUDYPLANNER_URL || 'http://localhost:3004';
const TUTORBOARD_URL = import.meta.env.VITE_TUTORBOARD_URL || 'http://localhost:3005';
const MYSANGGIBU_URL = import.meta.env.VITE_MYSANGGIBU_URL || 'http://localhost:3007';

// ───────────────────────── 카테고리별 서비스 ─────────────────────────
const navCategories = [
    {
        title: '성적 관리용 앱',
        items: [
            { label: 'My 생기부', href: MYSANGGIBU_URL },
            { label: 'Exam Hub', href: MYEXAM_URL },
        ],
    },
    {
        title: '학습용 앱',
        items: [
            { label: 'Study Planner', href: STUDYPLANNER_URL },
            { label: 'Tutor Board', href: TUTORBOARD_URL },
            { label: 'Study Arena', href: '/', isInternal: true },
        ],
    },
    {
        title: '입시 예측 앱',
        items: [
            { label: '수시 예측', href: SUSI_URL },
            { label: '정시 예측', href: JUNGSI_URL },
        ],
    },
];

// 내부 네비게이션 (로그인 후)
const internalNavItems = [
    { path: '/', label: '대시보드' },
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
            {/* ─── Header (Hub 스타일 다크 테마 + Arena 레드 악센트) ─── */}
            <header className="sticky top-0 z-40 w-full bg-gray-900">
                <div className="mx-auto max-w-7xl flex h-14 items-center justify-between px-4 lg:h-16 lg:px-6">
                    {/* ─── Logo ─── */}
                    <Link to="/" className="flex shrink-0 items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain lg:h-10 lg:w-10" />
                        <span className="font-bold text-lg text-white lg:text-xl">Geobuk School</span>
                    </Link>

                    {/* ─── Desktop Navigation (Hub 카테고리 드롭다운) ─── */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navCategories.map((cat) => (
                            <NavDropdown key={cat.title} title={cat.title}>
                                {cat.items.map((item) =>
                                    item.isInternal ? (
                                        <Link
                                            key={item.label}
                                            to={item.href}
                                            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-arena-500 font-semibold bg-arena-50 hover:bg-arena-100 transition-colors whitespace-nowrap"
                                        >
                                            <Swords className="h-4 w-4" />
                                            {item.label}
                                            <span className="ml-auto text-[10px] bg-arena-500 text-white px-1.5 py-0.5 rounded-full font-bold">현재</span>
                                        </Link>
                                    ) : (
                                        <a
                                            key={item.label}
                                            href={item.href}
                                            className="block rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-arena-500 transition-colors whitespace-nowrap"
                                        >
                                            {item.label}
                                        </a>
                                    )
                                )}
                            </NavDropdown>
                        ))}

                        {/* 로그인 시 내부 메뉴 */}
                        {isLoggedIn && (
                            <NavDropdown title="StudyArena" isArena>
                                {internalNavItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={cn(
                                            'block rounded-lg px-4 py-2 text-sm transition-colors whitespace-nowrap',
                                            location.pathname === item.path
                                                ? 'text-arena-500 font-semibold bg-arena-50'
                                                : 'text-gray-700 hover:bg-gray-50 hover:text-arena-500'
                                        )}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </NavDropdown>
                        )}
                    </nav>

                    {/* ─── Desktop Right Section ─── */}
                    <div className="hidden lg:flex items-center gap-2">
                        {isLoggedIn ? (
                            <>
                                {/* 알림 */}
                                <button
                                    className="relative p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                                    title="알림"
                                >
                                    <Bell className="h-5 w-5" />
                                </button>

                                {/* 프로필 / 로그아웃 */}
                                <PopoverPrimitive.Root>
                                    <PopoverPrimitive.Trigger asChild>
                                        <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors">
                                            <div className="h-7 w-7 rounded-full bg-arena-500 flex items-center justify-center">
                                                <Swords className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            내 정보
                                            <ChevronDown className="h-4 w-4" />
                                        </button>
                                    </PopoverPrimitive.Trigger>
                                    <PopoverPrimitive.Portal>
                                        <PopoverPrimitive.Content
                                            className="z-50 w-52 rounded-xl border bg-white p-2 shadow-xl"
                                            sideOffset={8}
                                            align="end"
                                        >
                                            <Link to="/ranking" className="flex h-9 w-full items-center rounded-lg px-3 text-sm hover:bg-gray-50 transition-colors">랭킹</Link>
                                            <SeparatorPrimitive.Root className="my-1 h-px bg-gray-100" />
                                            {/* 로그아웃 Dialog */}
                                            <DialogPrimitive.Root open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                                                <DialogPrimitive.Trigger asChild>
                                                    <button className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm font-normal text-red-500 hover:bg-red-50 transition-colors">
                                                        <LogOut className="h-4 w-4" />
                                                        로그아웃
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
                                        </PopoverPrimitive.Content>
                                    </PopoverPrimitive.Portal>
                                </PopoverPrimitive.Root>
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
                            <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
                            <span className="text-base font-bold text-white">Geobuk School</span>
                            <button
                                className="ml-auto text-white/50 hover:text-white text-xl transition-colors"
                                onClick={() => setMobileOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <nav className="flex flex-col gap-1 p-4">
                            {/* Hub 카테고리 */}
                            {navCategories.map((cat) => (
                                <div key={cat.title} className="mb-3">
                                    <div className="text-xs font-semibold text-white/40 uppercase tracking-wider px-3 mb-2">{cat.title}</div>
                                    {cat.items.map((item) =>
                                        item.isInternal ? (
                                            <Link
                                                key={item.label}
                                                to={item.href}
                                                onClick={() => setMobileOpen(false)}
                                                className="flex items-center gap-2 h-10 rounded-lg px-3 text-sm font-semibold text-arena-400 bg-arena-500/10"
                                            >
                                                <Swords className="h-4 w-4" />
                                                {item.label}
                                                <span className="ml-auto text-[10px] bg-arena-500 text-white px-1.5 py-0.5 rounded-full font-bold">현재</span>
                                            </Link>
                                        ) : (
                                            <a
                                                key={item.label}
                                                href={item.href}
                                                className="flex h-10 items-center rounded-lg px-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                                            >
                                                {item.label}
                                            </a>
                                        )
                                    )}
                                </div>
                            ))}

                            <SeparatorPrimitive.Root className="my-2 h-px bg-white/10" />

                            {/* 내부 메뉴 (로그인 시) */}
                            {isLoggedIn ? (
                                <>
                                    <div className="text-xs font-semibold text-arena-400/80 uppercase tracking-wider px-3 mb-2">
                                        <Swords className="h-3.5 w-3.5 inline mr-1" />
                                        StudyArena
                                    </div>
                                    {internalNavItems.map((item) => (
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

// ───────────────────────── NavDropdown 컴포넌트 ─────────────────────────
function NavDropdown({
    title,
    children,
    isArena,
}: {
    title: string;
    children: React.ReactNode;
    isArena?: boolean;
}) {
    return (
        <div className="relative group cursor-pointer py-2">
            <span
                className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isArena
                        ? 'text-arena-400 hover:text-arena-300 hover:bg-arena-500/10'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                )}
            >
                {isArena && <Swords className="h-4 w-4" />}
                {title}
                <ChevronDown className="h-3.5 w-3.5" />
            </span>

            {/* 드롭다운 */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2">
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2 min-w-[170px] flex flex-col gap-0.5 overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    );
}
