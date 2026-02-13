import { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import { BarChart3, Clock, Target, TrendingUp } from 'lucide-react';
import { snapshotApi } from '../lib/api';

interface StatDataPoint {
    label: string;
    date: string;
    totalStudyMin: number;
    achievementPct: number;
    score: number;
    memberCount: number;
}

type StatsPeriod = 'daily' | 'weekly' | 'monthly';

interface Props {
    arenaId: number;
}

export default function ArenaStatistics({ arenaId }: Props) {
    const [period, setPeriod] = useState<StatsPeriod>('daily');
    const [data, setData] = useState<StatDataPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [arenaId, period]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const { data: stats } = await snapshotApi.getStatistics(arenaId, period);
            setData(stats);
        } catch {
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const periods: { key: StatsPeriod; label: string }[] = [
        { key: 'daily', label: '일간' },
        { key: 'weekly', label: '주간' },
        { key: 'monthly', label: '월간' },
    ];

    // Summary stats
    const avgStudyMin = data.length > 0
        ? Math.round(data.reduce((s, d) => s + d.totalStudyMin, 0) / data.filter(d => d.memberCount > 0).length || 0)
        : 0;
    const avgAchievement = data.length > 0
        ? Math.round(data.reduce((s, d) => s + d.achievementPct, 0) / data.filter(d => d.memberCount > 0).length || 0)
        : 0;
    const avgScore = data.length > 0
        ? Math.round((data.reduce((s, d) => s + d.score, 0) / data.filter(d => d.memberCount > 0).length || 0) * 10) / 10
        : 0;

    const formatStudyTime = (min: number) => {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-xl text-sm">
                <div className="font-semibold text-gray-700 mb-1">{label}</div>
                {payload.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-gray-600">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span>{p.name}: {p.name === '학습시간' ? formatStudyTime(p.value) : `${p.value}${p.name === '달성률' ? '%' : '점'}`}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-arena-500" />
                    학습 통계
                </h2>
                <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                    {periods.map((p) => (
                        <button
                            key={p.key}
                            onClick={() => setPeriod(p.key)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${period === p.key
                                ? 'bg-arena-500 text-white shadow-md shadow-arena-500/25'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card-glass p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Clock className="w-4 h-4" />
                        <span>평균 학습시간</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatStudyTime(avgStudyMin)}</div>
                </div>
                <div className="card-glass p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Target className="w-4 h-4" />
                        <span>평균 달성률</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{avgAchievement}%</div>
                </div>
                <div className="card-glass p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>평균 점수</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{avgScore}점</div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <div className="card-glass p-6 h-64 animate-pulse">
                        <div className="h-full bg-gray-100 rounded-lg" />
                    </div>
                    <div className="card-glass p-6 h-64 animate-pulse">
                        <div className="h-full bg-gray-100 rounded-lg" />
                    </div>
                </div>
            ) : data.length === 0 || data.every(d => d.memberCount === 0) ? (
                <div className="card-glass p-12 text-center">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        아직 통계 데이터가 없습니다
                    </h3>
                    <p className="text-gray-500">
                        멤버들의 StudyPlanner 학습 데이터가 집계되면 여기에 차트가 표시됩니다.
                    </p>
                </div>
            ) : (
                <>
                    {/* 학습시간 차트 */}
                    <div className="card-glass p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            학습시간 추이 (분)
                        </h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="totalStudyMin"
                                    name="학습시간"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    fill="url(#studyGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* 달성률 차트 */}
                    <div className="card-glass p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4 text-emerald-500" />
                            미션 달성률 추이 (%)
                        </h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="achievementPct"
                                    name="달성률"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* 종합점수 차트 */}
                    <div className="card-glass p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-arena-500" />
                            종합점수 추이
                        </h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    name="점수"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    fill="url(#scoreGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
}
