import { useState, useEffect } from 'react';
import { Crown, TrendingUp, TrendingDown, Minus, Shield, Loader2 } from 'lucide-react';
import { leagueApi } from '../lib/api';

interface LeagueData {
    league: { name: string; tier: string; icon: string; color: string } | null;
    avgScore: number;
    promoted: boolean;
    demoted: boolean;
}

interface LeagueEntry {
    rank: number;
    memberId: number;
    avgScore: number;
    league: { name: string; tier: string; icon: string; color: string };
    promoted: boolean;
    demoted: boolean;
}

interface Props {
    arenaId: number;
}

export function LeagueSection({ arenaId }: Props) {
    const [myLeague, setMyLeague] = useState<LeagueData | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeagueEntry[]>([]);
    const [selectedTier, setSelectedTier] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [arenaId, selectedTier]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [myRes, lbRes] = await Promise.all([
                leagueApi.getMyLeague(arenaId),
                leagueApi.getLeagueLeaderboard(arenaId, selectedTier),
            ]);
            setMyLeague(myRes.data);
            setLeaderboard(lbRes.data);
        } catch { /* ignore */ }
        setLoading(false);
    };

    const tiers = [
        { tier: undefined, label: '전체' },
        { tier: 'master', label: '👑' },
        { tier: 'diamond', label: '💠' },
        { tier: 'platinum', label: '💎' },
        { tier: 'gold', label: '🥇' },
        { tier: 'silver', label: '🥈' },
        { tier: 'bronze', label: '🥉' },
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    리그
                </h2>
            </div>

            {/* 내 리그 카드 */}
            {myLeague?.league && (
                <div
                    className="p-4 rounded-2xl border-2 relative overflow-hidden"
                    style={{
                        borderColor: myLeague.league.color,
                        background: `linear-gradient(135deg, ${myLeague.league.color}10, ${myLeague.league.color}05)`,
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{myLeague.league.icon}</span>
                            <div>
                                <div className="font-bold text-lg" style={{ color: myLeague.league.color }}>
                                    {myLeague.league.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                    평균 점수: {myLeague.avgScore.toFixed(1)}
                                </div>
                            </div>
                        </div>
                        {myLeague.promoted && (
                            <div className="flex items-center gap-1 text-green-500 text-sm font-semibold">
                                <TrendingUp className="w-4 h-4" />
                                승급!
                            </div>
                        )}
                        {myLeague.demoted && (
                            <div className="flex items-center gap-1 text-red-500 text-sm font-semibold">
                                <TrendingDown className="w-4 h-4" />
                                강등
                            </div>
                        )}
                        {!myLeague.promoted && !myLeague.demoted && (
                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                                <Minus className="w-4 h-4" />
                                유지
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 티어 필터 */}
            <div className="flex gap-1 overflow-x-auto pb-1">
                {tiers.map((t) => (
                    <button
                        key={t.tier ?? 'all'}
                        onClick={() => setSelectedTier(t.tier)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedTier === t.tier
                            ? 'bg-arena-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* 리그 리더보드 */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    이번 주 데이터가 아직 없습니다
                </div>
            ) : (
                <div className="space-y-2">
                    {leaderboard.map((entry) => (
                        <div
                            key={entry.memberId}
                            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${entry.rank <= 3
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-600'
                                }`}>
                                {entry.rank}
                            </div>
                            <span className="text-lg">{entry.league.icon}</span>
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-800">
                                    멤버 #{entry.memberId}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {entry.league.name}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-gray-900">
                                    {entry.avgScore.toFixed(1)}
                                </div>
                                {entry.promoted && <TrendingUp className="w-3 h-3 text-green-500 ml-auto" />}
                                {entry.demoted && <TrendingDown className="w-3 h-3 text-red-500 ml-auto" />}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
