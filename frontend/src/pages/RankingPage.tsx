import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Crown, Medal, BarChart3, Loader2, ChevronLeft } from 'lucide-react';
import { rankingApi } from '../lib/api';
import { useAuthStore } from '../stores';

interface RankEntry {
    memberId: number;
    score: number;
    rank: number;
}

export default function RankingPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [topRanks, setTopRanks] = useState<RankEntry[]>([]);
    const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
    const [loading, setLoading] = useState(true);

    // 기본 arenaId (대시보드에서 넘어올 경우 추후 확장)
    const arenaId = 1;

    const loadRanking = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await rankingApi.getTop(arenaId, 20, period);
            setTopRanks(data || []);
        } catch { /* ignore */ }
        setLoading(false);
    }, [arenaId, period]);

    useEffect(() => { loadRanking(); }, [loadRanking]);

    const rankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />;
        if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
        if (rank === 3) return <Medal className="h-5 w-5 text-orange-400" />;
        return <span className="text-sm font-bold text-gray-400">{rank}</span>;
    };

    const rankBg = (rank: number) => {
        if (rank === 1) return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
        if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
        if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
        return 'bg-white border-gray-50';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
            <div className="mx-auto max-w-lg">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                    <ChevronLeft className="h-4 w-4" /> 돌아가기
                </button>

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                            <Zap className="h-6 w-6 text-amber-500" />
                            실시간 랭킹
                        </h1>
                        <p className="text-sm text-gray-500">학습 점수 기반 전체 랭킹</p>
                    </div>
                    <div className="flex gap-1 rounded-xl bg-white/80 p-1">
                        {(['daily', 'weekly'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${period === p
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {p === 'daily' ? '오늘' : '이번주'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
                    </div>
                ) : topRanks.length === 0 ? (
                    <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
                        <BarChart3 className="mx-auto mb-3 h-12 w-12 text-gray-200" />
                        <p className="text-gray-400">아직 랭킹 데이터가 없습니다</p>
                    </div>
                ) : (
                    <>
                        {/* Top 3 포디움 */}
                        <div className="mb-6 flex items-end justify-center gap-3">
                            {[topRanks[1], topRanks[0], topRanks[2]].filter(Boolean).map((entry, idx) => {
                                const heights = [80, 100, 64];
                                const colors = [
                                    'from-gray-300 to-gray-400',
                                    'from-amber-400 to-orange-500',
                                    'from-orange-300 to-amber-400',
                                ];
                                return (
                                    <div key={entry.memberId} className="flex flex-col items-center">
                                        <div className="mb-2">{rankIcon(entry.rank)}</div>
                                        <div className="text-xs font-medium text-gray-600 mb-1">#{entry.memberId}</div>
                                        <div className="text-sm font-bold text-gray-800 mb-2">{entry.score}</div>
                                        <div
                                            className={`w-20 rounded-t-xl bg-gradient-to-t ${colors[idx]} shadow-inner`}
                                            style={{ height: `${heights[idx]}px` }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* 4위 이하 */}
                        <div className="space-y-2">
                            {topRanks.slice(3).map(entry => (
                                <div
                                    key={entry.memberId}
                                    className={`flex items-center gap-3 rounded-xl p-3.5 border shadow-sm ${rankBg(entry.rank)}`}
                                >
                                    <div className="w-8 text-center">
                                        {rankIcon(entry.rank)}
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-sm font-semibold text-gray-800">멤버 #{entry.memberId}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-600">{entry.score}점</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
