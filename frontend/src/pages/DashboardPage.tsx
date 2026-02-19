import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Plus, ChevronRight, Swords, Flame, GraduationCap, UserPlus, BarChart3, ArrowRight } from 'lucide-react';
import { arenaApi } from '../lib/api';
import { useAuthStore } from '../stores';
import { redirectToLogin } from '../lib/auth';

interface ArenaItem {
    id: number;
    arenaCode: string;
    name: string;
    description: string | null;
    inviteCode: string;
    role: string;
    memberCount: number;
    joinedAt: string;
}

export default function DashboardPage() {
    const { isLoggedIn } = useAuthStore();
    const [arenas, setArenas] = useState<ArenaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isLoggedIn) {
            loadArenas();
        } else {
            setLoading(false);
        }
    }, [isLoggedIn]);

    const loadArenas = async () => {
        try {
            const { data } = await arenaApi.getMyArenas();
            setArenas(data);
        } catch {
            setArenas([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* 비로그인 시 환영 히어로 */}
            {!isLoggedIn && (
                <div className="relative overflow-hidden bg-gradient-to-r from-arena-50 to-arena-100 border border-arena-200 rounded-2xl p-8 md:p-10">
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-arena-500/10 rounded-full blur-3xl" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                            <Swords className="w-8 h-8 text-arena-500" />
                            <h1 className="text-3xl md:text-4xl font-extrabold text-arena-700">
                                StudyArena
                            </h1>
                        </div>
                        <p className="text-arena-700/70 text-lg max-w-xl">
                            클래스 친구들과 매일 학습 성과를 비교하고, 서로 경쟁하며 성장하세요.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={redirectToLogin}
                                className="bg-arena-500 hover:bg-arena-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-arena-500/25 active:scale-95 flex items-center gap-2"
                            >
                                로그인하고 시작하기
                            </button>
                            <Link to="/arena/join" className="border border-arena-500 text-arena-500 hover:bg-arena-50 font-medium px-5 py-2 rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                초대 코드로 참여
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* 비로그인 시 기능 소개 카드 */}
            {!isLoggedIn && (
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="card-glass p-6">
                        <div className="w-12 h-12 bg-arena-100 rounded-xl flex items-center justify-center mb-4 text-arena-600">
                            <Swords className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">선의의 경쟁</h3>
                        <p className="text-gray-500 text-sm">
                            친구들과 학습 시간을 비교하며<br />건전한 경쟁심을 길러보세요.
                        </p>
                    </div>
                    <div className="card-glass p-6">
                        <div className="w-12 h-12 bg-arena-100 rounded-xl flex items-center justify-center mb-4 text-arena-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">함께하는 성장</h3>
                        <p className="text-gray-500 text-sm">
                            혼자 공부하기 힘들 때,<br />같은 목표를 가진 친구들과 함께해요.
                        </p>
                    </div>
                    <div className="card-glass p-6">
                        <div className="w-12 h-12 bg-arena-100 rounded-xl flex items-center justify-center mb-4 text-arena-600">
                            <Plus className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">간편한 시작</h3>
                        <p className="text-gray-500 text-sm">
                            복잡한 절차 없이<br />초대 코드만으로 바로 참여하세요.
                        </p>
                    </div>
                </div>
            )}

            {/* 로그인 시 내 아레나 목록 */}
            {isLoggedIn && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-arena-500" />
                            내 아레나
                        </h2>
                        <span className="bg-arena-100 text-arena-500 text-sm font-medium px-3 py-1 rounded-full">
                            {arenas.length}개 참여 중
                        </span>
                    </div>

                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="card-glass p-6 animate-pulse">
                                    <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                                </div>
                            ))}
                        </div>
                    ) : arenas.length === 0 ? (
                        <div className="card-glass p-12 text-center">
                            <Flame className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                아직 참여한 아레나가 없습니다
                            </h3>
                            <p className="text-gray-500 mb-6">
                                아레나를 만들거나 초대 코드로 참여해보세요!
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Link to="/arena/create" className="bg-arena-500 hover:bg-arena-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-arena-500/25 active:scale-95 text-sm">
                                    Arena(스터디그룹) 만들기
                                </Link>
                                <Link to="/arena/join" className="border border-arena-500 text-arena-500 hover:bg-arena-50 font-medium px-5 py-2 rounded-xl transition-all active:scale-95 text-sm">
                                    참여하기
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {arenas.map((arena) => (
                                <Link
                                    key={arena.id}
                                    to={`/arena/${arena.id}`}
                                    className="card-glass-hover p-6 group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-arena-500 transition-colors">
                                            {arena.name}
                                        </h3>
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-arena-500 transition-colors" />
                                    </div>
                                    {arena.description && (
                                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                            {arena.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1 text-gray-500">
                                            <Users className="w-4 h-4" />
                                            {arena.memberCount}명
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${arena.role === 'owner'
                                            ? 'bg-arena-100 text-arena-500'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {arena.role === 'owner' ? '관리자' : '멤버'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 선생님 전용 클래스 관리 섹션 */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-[1px]">
                <div className="rounded-2xl bg-white/95 backdrop-blur-sm p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                선생님 전용 클래스 관리
                            </h2>
                            <p className="text-sm text-gray-500">
                                반 학생들의 학습 현황을 한눈에 파악하세요
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-600 mb-6 leading-relaxed">
                        Study Arena에 <strong>우리 반 클래스</strong>를 만들고, 학생들을 등록하면
                        <br className="hidden sm:block" />
                        <span className="text-indigo-600 font-semibold">일간 · 주간 · 월간 학습 분량 비교 차트</span>를 통해
                        학생들의 성장을 추적할 수 있습니다.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-3 mb-6">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/80 border border-indigo-100">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Plus className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm">클래스 생성</h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    반 이름을 입력해 간편하게 클래스를 만듭니다
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50/80 border border-purple-100">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <UserPlus className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm">학생 등록</h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    학생 ID를 입력해 한번에 등록합니다
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-pink-50/80 border border-pink-100">
                            <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <BarChart3 className="w-4 h-4 text-pink-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 text-sm">학습량 비교</h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    일간 · 주간 · 월간 차트로 비교 분석
                                </p>
                            </div>
                        </div>
                    </div>

                    <a
                        href="http://localhost:3020"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-95 text-sm"
                    >
                        클래스 관리 시작하기
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}
