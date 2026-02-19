import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    BarChart3, Users, AlertTriangle, TrendingUp, Clock, Target,
    ChevronLeft, Loader2, Crown, Medal, Trophy
} from 'lucide-react';
import { teacherApi, leaderboardApi } from '../lib/api';

type Period = 'daily' | 'weekly' | 'monthly';
const periodLabels: Record<Period, string> = { daily: '일간', weekly: '주간', monthly: '월간' };

function formatStudyTime(min: number) {
    if (min < 60) return `${min}분`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

interface Overview {
    arenaId: number;
    arenaName: string;
    totalMembers: number;
    todayStats: {
        activeMemberCount: number;
        participationRate: number;
        totalStudyMinutes: number;
        avgStudyMinutes: number;
    };
}

interface LowMember {
    memberId: number;
    studentId: number;
    daysSinceActivity: number;
}

interface TopStudent {
    rank: number;
    memberId: number;
    totalStudyMin: number;
}

export default function TeacherPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const arenaId = id ? parseInt(id, 10) : 0;

    const [overview, setOverview] = useState<Overview | null>(null);
    const [lowParticipation, setLowParticipation] = useState<{ count: number; threshold: string; members: LowMember[] } | null>(null);
    const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [period, setPeriod] = useState<Period>('daily');
    const [tab, setTab] = useState<'overview' | 'ranking' | 'alerts'>('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (arenaId) loadData();
    }, [arenaId]);

    useEffect(() => {
        if (arenaId) loadLeaderboard();
    }, [period, arenaId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [overviewRes, reportRes] = await Promise.all([
                teacherApi.getOverview(arenaId),
                teacherApi.getWeeklyReport(arenaId),
            ]);
            setOverview(overviewRes.data);
            setLowParticipation(reportRes.data?.lowParticipation || null);
            setTopStudents(reportRes.data?.topStudents || []);
        } catch { /* ignore */ }
        setLoading(false);
    };

    const loadLeaderboard = async () => {
        try {
            const res = await leaderboardApi.getLeaderboard(arenaId, period);
            setLeaderboard(res.data || []);
        } catch { setLeaderboard([]); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 뒤로가기 */}
            <button onClick={() => navigate('/teacher-class')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ChevronLeft className="h-4 w-4" /> 반 목록
            </button>

            {/* 헤더 */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-6 h-6" />
                    <h1 className="text-2xl font-bold">교사 대시보드</h1>
                </div>
                <p className="text-white/70 text-sm">{overview?.arenaName || '아레나'}</p>

                {overview && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <Users className="w-4 h-4 mx-auto mb-1 opacity-70" />
                            <div className="text-xl font-bold">{overview.totalMembers}</div>
                            <div className="text-[10px] opacity-60">전체 학생</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <Target className="w-4 h-4 mx-auto mb-1 opacity-70" />
                            <div className="text-xl font-bold">{overview.todayStats.participationRate}%</div>
                            <div className="text-[10px] opacity-60">오늘 참여율</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                            <Clock className="w-4 h-4 mx-auto mb-1 opacity-70" />
                            <div className="text-xl font-bold">{overview.todayStats.avgStudyMinutes}분</div>
                            <div className="text-[10px] opacity-60">평균 학습</div>
                        </div>
                    </div>
                )}
            </div>

            {/* 탭 */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(['overview', 'ranking', 'alerts'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {t === 'overview' && <><BarChart3 className="w-4 h-4" /> 개요</>}
                        {t === 'ranking' && <><Trophy className="w-4 h-4" /> 랭킹</>}
                        {t === 'alerts' && <><AlertTriangle className="w-4 h-4" /> 알림</>}
                    </button>
                ))}
            </div>

            {/* 개요 탭 */}
            {tab === 'overview' && (
                <div className="space-y-4">
                    {/* 오늘 통계 상세 */}
                    {overview && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-500" /> 오늘 현황
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">참여율</span>
                                        <span className="font-medium">{overview.todayStats.activeMemberCount}/{overview.totalMembers}명</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                                            style={{ width: `${overview.todayStats.participationRate}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 mb-1">총 학습시간</div>
                                        <div className="font-bold text-gray-900">{formatStudyTime(overview.todayStats.totalStudyMinutes)}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 mb-1">평균 학습시간</div>
                                        <div className="font-bold text-gray-900">{formatStudyTime(overview.todayStats.avgStudyMinutes)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 주간 Top 5 */}
                    {topStudents.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" /> 주간 학습 Top 5
                            </h3>
                            <div className="space-y-2">
                                {topStudents.map(s => {
                                    const maxMin = topStudents[0]?.totalStudyMin || 1;
                                    const pct = Math.round((s.totalStudyMin / maxMin) * 100);
                                    return (
                                        <div key={s.memberId} className="bg-gray-50 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${s.rank === 1 ? 'bg-amber-500' : s.rank === 2 ? 'bg-gray-400' : s.rank === 3 ? 'bg-orange-400' : 'bg-gray-300'}`}>
                                                        {s.rank}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-800">멤버 #{s.memberId}</span>
                                                </div>
                                                <span className="text-xs text-gray-500">{formatStudyTime(s.totalStudyMin)}</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 랭킹 탭 */}
            {tab === 'ranking' && (
                <div className="space-y-4">
                    {/* 기간 선택 */}
                    <div className="flex gap-2">
                        {(Object.entries(periodLabels) as [Period, string][]).map(([p, label]) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${period === p
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* 리더보드 */}
                    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                        {leaderboard.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>학습 데이터가 없습니다.</p>
                            </div>
                        ) : (
                            leaderboard.map((entry: any) => (
                                <div key={entry.memberId} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                                    <div className="w-8 flex justify-center">
                                        {entry.rank === 1 ? <Crown className="w-5 h-5 text-yellow-500" /> :
                                            entry.rank === 2 ? <Medal className="w-5 h-5 text-gray-400" /> :
                                                entry.rank === 3 ? <Medal className="w-5 h-5 text-amber-600" /> :
                                                    <span className="text-sm font-bold text-gray-400">{entry.rank}</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900">학생 #{entry.studentId || entry.memberId}</div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                            <span><Clock className="w-3 h-3 inline mr-0.5" />{formatStudyTime(entry.totalStudyMin)}</span>
                                            <span><Target className="w-3 h-3 inline mr-0.5" />달성 {entry.achievementPct}%</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-indigo-600">{entry.score}</div>
                                        <div className="text-xs text-gray-400">점</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* 알림 탭 */}
            {tab === 'alerts' && (
                <div className="space-y-4">
                    {lowParticipation && lowParticipation.count > 0 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                            <h3 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {lowParticipation.threshold}: {lowParticipation.count}명
                            </h3>
                            <div className="space-y-2">
                                {lowParticipation.members.map(m => (
                                    <div key={m.memberId} className="flex items-center justify-between bg-white rounded-lg p-3">
                                        <span className="text-sm text-gray-700">학생 #{m.studentId}</span>
                                        <span className="text-xs text-amber-600 font-medium">{m.daysSinceActivity}일 미활동</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p>미활동 학생이 없습니다. 👍</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
