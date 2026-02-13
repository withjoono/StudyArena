import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart3, Users, AlertTriangle, TrendingUp, Clock, Target, ChevronLeft, Loader2 } from 'lucide-react';
import { teacherApi } from '../lib/api';

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (arenaId) loadData();
    }, [arenaId]);

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

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-arena-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
            <div className="mx-auto max-w-lg">
                {/* 뒤로가기 */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                    <ChevronLeft className="h-4 w-4" /> 돌아가기
                </button>

                <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-900">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                    교사 대시보드
                </h1>
                <p className="mb-6 text-sm text-gray-500">{overview?.arenaName || '아레나'}</p>

                {/* 오늘 통계 */}
                {overview && (
                    <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-50">
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                <Users className="h-3.5 w-3.5" /> 참여율
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {overview.todayStats.participationRate}%
                            </div>
                            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                    style={{ width: `${overview.todayStats.participationRate}%` }}
                                />
                            </div>
                            <div className="mt-1 text-[10px] text-gray-300">
                                {overview.todayStats.activeMemberCount}/{overview.totalMembers}명 활동 중
                            </div>
                        </div>
                        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-50">
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                                <Clock className="h-3.5 w-3.5" /> 평균 학습
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {overview.todayStats.avgStudyMinutes}분
                            </div>
                            <div className="mt-1 text-[10px] text-gray-300">
                                오늘 총 {overview.todayStats.totalStudyMinutes}분
                            </div>
                        </div>
                    </div>
                )}

                {/* 미활동 학생 알림 */}
                {lowParticipation && lowParticipation.count > 0 && (
                    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-semibold text-amber-700">
                                {lowParticipation.threshold}: {lowParticipation.count}명
                            </span>
                        </div>
                        <div className="space-y-1">
                            {lowParticipation.members.map(m => (
                                <div key={m.memberId} className="flex items-center justify-between rounded-lg bg-white p-2.5">
                                    <span className="text-sm text-gray-700">학생 #{m.studentId}</span>
                                    <span className="text-xs text-amber-600">{m.daysSinceActivity}일 미활동</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 주간 Top 5 */}
                {topStudents.length > 0 && (
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            주간 학습 Top 5
                        </h3>
                        <div className="space-y-2">
                            {topStudents.map(s => {
                                const maxMin = topStudents[0]?.totalStudyMin || 1;
                                const pct = Math.round((s.totalStudyMin / maxMin) * 100);
                                return (
                                    <div key={s.memberId} className="rounded-xl bg-gray-50 p-3">
                                        <div className="mb-1 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${s.rank === 1 ? 'bg-amber-500' : s.rank === 2 ? 'bg-gray-400' : s.rank === 3 ? 'bg-orange-400' : 'bg-gray-300'
                                                    }`}>
                                                    {s.rank}
                                                </span>
                                                <span className="text-sm font-medium text-gray-800">멤버 #{s.memberId}</span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {s.totalStudyMin >= 60
                                                    ? `${Math.floor(s.totalStudyMin / 60)}시간 ${s.totalStudyMin % 60}분`
                                                    : `${s.totalStudyMin}분`}
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
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
        </div>
    );
}
