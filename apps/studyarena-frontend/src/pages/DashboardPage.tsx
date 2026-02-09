import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Plus, ChevronRight, Swords, Flame } from 'lucide-react';
import { arenaApi } from '../lib/api';

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
    const [arenas, setArenas] = useState<ArenaItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadArenas();
    }, []);

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
            {/* 히어로 — 알림 박스 패턴 */}
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
                        <Link to="/arena/create" className="bg-arena-500 hover:bg-arena-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-arena-500/25 active:scale-95 flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Arena(스터디그룹) 만들기
                        </Link>
                        <Link to="/arena/join" className="border border-arena-500 text-arena-500 hover:bg-arena-50 font-medium px-5 py-2 rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            초대 코드로 참여
                        </Link>
                    </div>
                </div>
            </div>

            {/* 내 아레나 목록 */}
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
        </div>
    );
}
