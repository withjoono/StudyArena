import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Trophy, Users, ChevronRight, Swords, Flame, Zap,
    Target, Plus, ArrowRight, Clock, Crown, Medal, UserPlus
} from 'lucide-react';
import { arenaApi, leaderboardApi } from '../lib/api';
import { useAuthStore } from '../stores';

import PromoPage from './PromoPage';

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

function formatStudyTime(min: number) {
    if (!min) return '0분';
    if (min < 60) return `${min}분`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

export default function DashboardPage() {
    const { isLoggedIn } = useAuthStore();
    const navigate = useNavigate();
    const [arenas, setArenas] = useState<ArenaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [topRankers, setTopRankers] = useState<any[]>([]);

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
            // 첫 번째 아레나의 리더보드 미리보기
            if (data.length > 0) {
                try {
                    const lb = await leaderboardApi.getLeaderboard(data[0].id, 'weekly');
                    setTopRankers((lb.data || []).slice(0, 3));
                } catch { }
            }
        } catch {
            setArenas([]);
        } finally {
            setLoading(false);
        }
    };

    // 비로그인
    if (!isLoggedIn) return <PromoPage />;

    return (
        <div className="space-y-6">
            {/* ─── 환영 헤더 ─── */}
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl" />
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold mb-1">Study Arena</h1>
                    <p className="text-white/80 text-sm mb-4">친구들과 학습 경쟁하며 함께 성장하세요</p>
                    <div className="flex gap-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                            <div className="text-xl font-bold">{arenas.length}</div>
                            <div className="text-xs text-white/70">참여 아레나</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                            <div className="text-xl font-bold">{arenas.reduce((sum, a) => sum + a.memberCount, 0)}</div>
                            <div className="text-xs text-white/70">전체 멤버</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── 퀵 액션 ─── */}
            <div className="grid grid-cols-3 gap-3">
                <Link
                    to="/arena/create"
                    className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center hover:shadow-md transition-all group"
                >
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2 text-white group-hover:scale-105 transition-transform">
                        <Plus className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900">아레나 만들기</div>
                    <div className="text-xs text-gray-500">동일목표반</div>
                </Link>
                <Link
                    to="/arena/join"
                    className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center hover:shadow-md transition-all group"
                >
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2 text-white group-hover:scale-105 transition-transform">
                        <UserPlus className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900">참여하기</div>
                    <div className="text-xs text-gray-500">초대코드 입력</div>
                </Link>
                <Link
                    to="/study-group"
                    className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center hover:shadow-md transition-all group"
                >
                    <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-2 text-white group-hover:scale-105 transition-transform">
                        <Users className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900">스터디그룹</div>
                    <div className="text-xs text-gray-500">함께 공부</div>
                </Link>
            </div>

            {/* ─── 내 아레나 ─── */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-orange-500" />
                        내 아레나
                    </h2>
                    <span className="bg-orange-100 text-orange-600 text-xs font-medium px-2.5 py-1 rounded-full">
                        {arenas.length}개
                    </span>
                </div>

                {loading ? (
                    <div className="grid gap-3 md:grid-cols-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                                <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : arenas.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                        <Flame className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-700 mb-1">아직 참여한 아레나가 없습니다</h3>
                        <p className="text-sm text-gray-500 mb-4">아레나를 만들거나 초대코드로 참여해보세요!</p>
                        <div className="flex gap-2 justify-center">
                            <Link to="/arena/create" className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
                                만들기
                            </Link>
                            <Link to="/arena/join" className="border border-orange-500 text-orange-500 hover:bg-orange-50 font-medium px-5 py-2 rounded-lg text-sm transition-colors">
                                참여하기
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {arenas.map((arena) => (
                            <Link
                                key={arena.id}
                                to={`/arena/${arena.id}`}
                                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-orange-200 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
                                        {arena.name}
                                    </h3>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
                                </div>
                                {arena.description && (
                                    <p className="text-sm text-gray-500 mb-2 line-clamp-1">{arena.description}</p>
                                )}
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="flex items-center gap-1 text-gray-500">
                                        <Users className="w-3.5 h-3.5" /> {arena.memberCount}명
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full font-medium ${arena.role === 'owner' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                                        {arena.role === 'owner' ? '관리자' : '멤버'}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* ─── 이번 주 Top 3 미리보기 ─── */}
            {topRankers.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-500" />
                            이번 주 랭킹 Top 3
                        </h2>
                        <Link to="/ranking" className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
                            전체 보기 <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {topRankers.map((entry: any, idx: number) => (
                            <div key={entry.memberId || idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : idx === 1 ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-amber-600'}`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                        학생 #{entry.studentId || entry.memberId}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formatStudyTime(entry.totalStudyMin)}
                                    </div>
                                </div>
                                <div className="text-sm font-bold text-orange-500">{entry.score}점</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── 배틀 바로가기 ─── */}
            <div className="grid grid-cols-2 gap-3">
                <div
                    onClick={() => navigate('/battle')}
                    className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white">
                            <Swords className="w-4 h-4" />
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">모의고사 배틀</div>
                    </div>
                    <p className="text-xs text-gray-500">1:1 모의고사 대결</p>
                    <ArrowRight className="w-4 h-4 text-rose-400 mt-2 group-hover:translate-x-1 transition-transform" />
                </div>
                <div
                    onClick={() => navigate('/study-battle')}
                    className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                            <Zap className="w-4 h-4" />
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">스터디 배틀</div>
                    </div>
                    <p className="text-xs text-gray-500">학습시간 경쟁</p>
                    <ArrowRight className="w-4 h-4 text-emerald-400 mt-2 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </div>
    );
}
