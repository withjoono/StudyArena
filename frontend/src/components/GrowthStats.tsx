import { useState, useEffect } from 'react';
import { TrendingUp, Target, Flame, BarChart3, ChevronUp, ChevronDown } from 'lucide-react';
import { leaderboardApi, snapshotApi } from '../lib/api';

interface Props {
    arenaId: number;
    memberId: number;
}

/**
 * 자기 성장 중심 UI (전략적 비공개)
 * - 하위권: 절대 순위 대신 "상위 N% 진입까지 M점"
 * - 변화량 강조: "어제보다 N위 상승"
 * - 스터디 스트릭 시각화
 */
export function GrowthStats({ arenaId, memberId }: Props) {
    const [myRanking, setMyRanking] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [arenaId, memberId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [rankRes, statsRes] = await Promise.all([
                leaderboardApi.getMyRanking(arenaId, 'daily'),
                snapshotApi.getStatistics(arenaId, 'weekly'),
            ]);
            setMyRanking(rankRes.data);
            setStats(statsRes.data);

            // TODO: 스트릭 API 연동
            setStreak(Math.floor(Math.random() * 14) + 1); // 임시 값
        } catch { /* ignore */ }
        setLoading(false);
    };

    const renderRankDisplay = () => {
        if (!myRanking) return null;

        const totalMembers = myRanking.totalMembers || 10;
        const rank = myRanking.rank || 1;
        const percentile = Math.round((rank / totalMembers) * 100);
        const rankChange = myRanking.rankChange || 0;

        // 전략적 표시: 상위 30% 이내이면 정확한 순위, 아니면 퍼센타일+목표
        if (percentile <= 30) {
            return (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                    <div className="text-3xl font-black text-amber-600">
                        {rank}<span className="text-sm font-normal text-amber-400">위</span>
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-semibold text-amber-700">
                            상위 {percentile}%
                        </div>
                        {rankChange !== 0 && (
                            <div className={`flex items-center gap-1 text-xs ${rankChange > 0 ? 'text-green-500' : 'text-red-400'}`}>
                                {rankChange > 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                어제보다 {Math.abs(rankChange)}위 {rankChange > 0 ? '상승' : '하락'}
                            </div>
                        )}
                    </div>
                </div>
            );
        } else {
            // 하위권: 전략적 비공개
            const targetRank = Math.ceil(totalMembers * 0.3);
            const gap = myRanking.score
                ? Math.max(0, (myRanking.topScore || 100) * 0.3 - (myRanking.score || 0))
                : 0;

            return (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-blue-700">
                            상위 30% 진입까지
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-blue-600">
                            {gap.toFixed(0)}
                        </span>
                        <span className="text-sm text-blue-400">점 남았어요</span>
                    </div>
                    {rankChange > 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                            <TrendingUp className="w-3 h-3" />
                            어제보다 {rankChange}위 상승! 좋은 흐름이에요 💪
                        </div>
                    )}
                </div>
            );
        }
    };

    const renderStreak = () => {
        const days = Array.from({ length: 14 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (13 - i));
            return {
                date: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
                active: i >= 14 - streak,
            };
        });

        return (
            <div className="p-4 bg-white rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-semibold text-gray-800">학습 스트릭</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-orange-500">{streak}</span>
                        <span className="text-xs text-gray-400">일 연속</span>
                    </div>
                </div>
                <div className="flex gap-1">
                    {days.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div
                                className={`w-full aspect-square rounded-sm transition-all ${day.active
                                    ? 'bg-orange-400'
                                    : 'bg-gray-100'
                                    }`}
                            />
                            <span className="text-[8px] text-gray-400">{day.date.charAt(0)}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) return null;

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                나의 성장
            </h2>

            {renderRankDisplay()}
            {renderStreak()}
        </div>
    );
}
