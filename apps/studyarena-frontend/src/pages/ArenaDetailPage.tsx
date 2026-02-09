import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Clock, Target, Flame, Crown, Medal } from 'lucide-react';
import { arenaApi, leaderboardApi } from '../lib/api';
import { useArenaStore } from '../stores';

interface LeaderboardEntry {
    rank: number;
    studentId: number;
    memberId: number;
    totalMissions: number;
    completedMissions: number;
    achievementPct: number;
    totalStudyMin: number;
    avgFocusRate: number | null;
    score: number;
}

interface ArenaDetail {
    id: number;
    name: string;
    description: string | null;
    inviteCode: string;
    maxMembers: number;
    members: any[];
}

export default function ArenaDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [arena, setArena] = useState<ArenaDetail | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { selectedPeriod, setPeriod } = useArenaStore();

    useEffect(() => {
        if (id) {
            loadArena(parseInt(id, 10));
            loadLeaderboard(parseInt(id, 10), selectedPeriod);
        }
    }, [id, selectedPeriod]);

    const loadArena = async (arenaId: number) => {
        try {
            const { data } = await arenaApi.getArenaDetail(arenaId);
            setArena(data);
        } catch {
            setArena(null);
        }
    };

    const loadLeaderboard = async (arenaId: number, period: string) => {
        try {
            const { data } = await leaderboardApi.getLeaderboard(arenaId, period as any);
            setLeaderboard(data);
        } catch {
            setLeaderboard([]);
        } finally {
            setLoading(false);
        }
    };

    const periods = [
        { key: 'daily' as const, label: '오늘' },
        { key: 'weekly' as const, label: '이번 주' },
        { key: 'monthly' as const, label: '이번 달' },
    ];

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
        if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
        return null;
    };

    const getRankBadgeClass = (rank: number) => {
        if (rank === 1) return 'rank-badge rank-1';
        if (rank === 2) return 'rank-badge rank-2';
        if (rank === 3) return 'rank-badge rank-3';
        return 'rank-badge bg-gray-100 text-gray-600';
    };

    const formatStudyTime = (min: number) => {
        const hours = Math.floor(min / 60);
        const mins = min % 60;
        if (hours === 0) return `${mins}분`;
        return `${hours}시간 ${mins}분`;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="card-glass p-8 animate-pulse">
                    <div className="h-7 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="card-glass p-4 animate-pulse">
                            <div className="h-5 bg-gray-200 rounded w-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 아레나 헤더 */}
            <div className="card-glass p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                            {arena?.name || '아레나'}
                        </h1>
                        {arena?.description && (
                            <p className="text-gray-500 mt-1">{arena.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span>멤버 {arena?.members.length || 0}명</span>
                            <span className="text-gray-300">|</span>
                            <span>초대코드: <code className="bg-arena-100 text-arena-500 px-2 py-0.5 rounded font-mono text-xs font-semibold">{arena?.inviteCode}</code></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 기간 탭 */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                {periods.map((p) => (
                    <button
                        key={p.key}
                        onClick={() => setPeriod(p.key)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedPeriod === p.key
                                ? 'bg-arena-500 text-white shadow-lg shadow-arena-500/25'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* 포디움 (Top 3) */}
            {leaderboard.length >= 3 && (
                <div className="grid grid-cols-3 gap-4">
                    {[1, 0, 2].map((idx) => {
                        const entry = leaderboard[idx];
                        if (!entry) return null;
                        const isFirst = entry.rank === 1;
                        return (
                            <div
                                key={entry.memberId}
                                className={`card-glass p-5 text-center ${isFirst ? 'md:-mt-4 border-yellow-300 bg-gradient-to-b from-yellow-50 to-white' : ''
                                    }`}
                            >
                                <div className={`mx-auto mb-3 ${getRankBadgeClass(entry.rank)} w-12 h-12 text-lg`}>
                                    {entry.rank}
                                </div>
                                <div className="font-bold text-gray-900 mb-1">
                                    학생 {entry.studentId}
                                </div>
                                <div className={`text-2xl font-extrabold mb-2 ${isFirst ? 'text-gradient-gold' : 'text-gray-700'
                                    }`}>
                                    {entry.score.toFixed(1)}점
                                </div>
                                <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                                    <Target className="w-3.5 h-3.5" />
                                    {entry.achievementPct}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 전체 순위 리더보드 */}
            <div className="card-glass overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-arena-500" />
                        전체 순위
                    </h2>
                </div>

                {leaderboard.length === 0 ? (
                    <div className="p-12 text-center">
                        <Flame className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">아직 학습 데이터가 없습니다</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {leaderboard.map((entry) => (
                            <div
                                key={entry.memberId}
                                className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${entry.rank <= 3 ? 'bg-gray-50/50' : ''
                                    }`}
                            >
                                <div className="w-10 flex justify-center">
                                    {getRankIcon(entry.rank) || (
                                        <span className={getRankBadgeClass(entry.rank)}>{entry.rank}</span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 truncate">
                                        학생 {entry.studentId}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                        <span className="flex items-center gap-1">
                                            <Target className="w-3 h-3" />
                                            미션 {entry.completedMissions}/{entry.totalMissions}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatStudyTime(entry.totalStudyMin)}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
                                            <div
                                                className="h-full bg-arena-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(entry.achievementPct, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                                            {entry.achievementPct}%
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        점수: {entry.score.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
