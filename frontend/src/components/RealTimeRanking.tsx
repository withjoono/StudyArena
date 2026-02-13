import { useState, useEffect } from 'react';
import { TrendingUp, Medal, Zap, Crown, ChevronUp, ChevronDown, Minus, Loader2, BarChart3 } from 'lucide-react';
import { rankingApi } from '../lib/api';

interface RankEntry {
    memberId: number;
    score: number;
    rank: number;
}

interface Props {
    arenaId: number;
    memberId?: number;
}

export function RealTimeRanking({ arenaId, memberId }: Props) {
    const [topRanks, setTopRanks] = useState<RankEntry[]>([]);
    const [myData, setMyData] = useState<{ myRank: number | null; totalMembers: number; nearby: RankEntry[] } | null>(null);
    const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadRanking(); }, [arenaId, period]);

    const loadRanking = async () => {
        setLoading(true);
        try {
            const [topRes, nearbyRes] = await Promise.all([
                rankingApi.getTop(arenaId, 10, period),
                memberId
                    ? rankingApi.getNearby(arenaId, memberId, period)
                    : Promise.resolve({ data: null }),
            ]);
            setTopRanks(topRes.data || []);
            setMyData(nearbyRes.data);
        } catch { /* ignore */ }
        setLoading(false);
    };

    const rankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="h-4 w-4 text-amber-500" />;
        if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
        if (rank === 3) return <Medal className="h-4 w-4 text-orange-400" />;
        return <span className="text-xs font-bold text-gray-400">{rank}</span>;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <Zap className="h-5 w-5 text-amber-500" />
                    실시간 랭킹
                </h2>
                <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
                    {(['daily', 'weekly'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${period === p ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400'}`}
                        >
                            {p === 'daily' ? '오늘' : '이번주'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                </div>
            ) : topRanks.length === 0 ? (
                <div className="rounded-xl bg-gray-50 p-8 text-center">
                    <BarChart3 className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                    <p className="text-sm text-gray-400">아직 랭킹 데이터가 없습니다</p>
                </div>
            ) : (
                <>
                    {/* Top 3 — 강조 */}
                    <div className="grid grid-cols-3 gap-2">
                        {topRanks.slice(0, 3).map((entry, idx) => (
                            <div
                                key={entry.memberId}
                                className={`rounded-xl p-3 text-center border ${idx === 0
                                    ? 'bg-gradient-to-b from-amber-50 to-amber-100/50 border-amber-200'
                                    : idx === 1
                                        ? 'bg-gradient-to-b from-gray-50 to-gray-100/50 border-gray-200'
                                        : 'bg-gradient-to-b from-orange-50 to-orange-100/50 border-orange-200'
                                    }`}
                            >
                                <div className="mb-1">{rankIcon(entry.rank)}</div>
                                <div className="text-xs font-semibold text-gray-700">#{entry.memberId}</div>
                                <div className={`text-lg font-bold ${idx === 0 ? 'text-amber-600' : idx === 1 ? 'text-gray-500' : 'text-orange-500'}`}>
                                    {entry.score}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 4위 이하 */}
                    <div className="divide-y divide-gray-50">
                        {topRanks.slice(3).map(entry => (
                            <div key={entry.memberId} className="flex items-center gap-3 py-2.5 px-1">
                                <span className="w-6 text-center text-xs font-bold text-gray-300">{entry.rank}</span>
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-700">멤버 #{entry.memberId}</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-500">{entry.score}</span>
                            </div>
                        ))}
                    </div>

                    {/* 내 순위 */}
                    {myData && myData.myRank !== null && (
                        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4">
                            <div className="mb-1 text-xs font-medium text-indigo-400">내 순위</div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-indigo-600">{myData.myRank}위</span>
                                    <span className="text-xs text-gray-400">/ {myData.totalMembers}명</span>
                                </div>
                                <TrendingUp className="h-5 w-5 text-indigo-400" />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
