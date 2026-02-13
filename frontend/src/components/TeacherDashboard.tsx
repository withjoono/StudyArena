import { useState, useEffect } from 'react';
import { Users, BarChart3, AlertTriangle, TrendingUp, Award, Loader2 } from 'lucide-react';
import api from '../lib/api';

interface ArenaOverview {
    arenaName: string;
    totalMembers: number;
    todayStats: {
        activeMemberCount: number;
        participationRate: number;
        totalStudyMinutes: number;
        avgStudyMinutes: number;
    };
}

interface LowParticipation {
    threshold: string;
    count: number;
    members: { memberId: number; nickname: string; daysSinceActivity: number }[];
}

interface TopStudent {
    rank: number;
    memberId: number;
    totalStudyMin: number;
}

interface Props {
    arenaId: number;
}

export function TeacherDashboard({ arenaId }: Props) {
    const [overview, setOverview] = useState<ArenaOverview | null>(null);
    const [lowParticipation, setLowParticipation] = useState<LowParticipation | null>(null);
    const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [arenaId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [overviewRes, reportRes] = await Promise.all([
                api.get('/teacher/overview', { params: { arenaId } }),
                api.get('/teacher/weekly-report', { params: { arenaId } }),
            ]);
            setOverview(overviewRes.data);
            setLowParticipation(reportRes.data.lowParticipation);
            setTopStudents(reportRes.data.topStudents || []);
        } catch { /* ignore */ }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                교사 대시보드
            </h2>

            {/* 오늘 통계 */}
            {overview && (
                <div className="grid grid-cols-2 gap-3">
                    <StatCard
                        label="참여율"
                        value={`${overview.todayStats.participationRate}%`}
                        sub={`${overview.todayStats.activeMemberCount}/${overview.totalMembers}명`}
                        icon={<Users className="w-4 h-4 text-blue-500" />}
                        color="bg-blue-50 border-blue-100"
                    />
                    <StatCard
                        label="총 학습시간"
                        value={`${overview.todayStats.totalStudyMinutes}분`}
                        sub={`평균 ${overview.todayStats.avgStudyMinutes}분`}
                        icon={<TrendingUp className="w-4 h-4 text-green-500" />}
                        color="bg-green-50 border-green-100"
                    />
                </div>
            )}

            {/* 미활동 학생 알림 */}
            {lowParticipation && lowParticipation.count > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-semibold text-amber-700">
                            미활동 학생 ({lowParticipation.count}명)
                        </span>
                    </div>
                    <div className="text-xs text-amber-600">
                        {lowParticipation.threshold}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                        {lowParticipation.members.map(m => (
                            <span
                                key={m.memberId}
                                className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs"
                            >
                                {m.nickname || `#${m.memberId}`}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* 주간 Top 학생 */}
            {topStudents.length > 0 && (
                <div className="p-4 bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Award className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-semibold text-gray-800">이번 주 Top 5</span>
                    </div>
                    <div className="space-y-2">
                        {topStudents.map(s => (
                            <div key={s.memberId} className="flex items-center gap-3">
                                <span className={`text-sm font-bold w-6 text-center ${s.rank === 1 ? 'text-amber-500' :
                                        s.rank === 2 ? 'text-gray-400' :
                                            s.rank === 3 ? 'text-orange-400' : 'text-gray-300'
                                    }`}>
                                    {s.rank}
                                </span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full"
                                        style={{
                                            width: `${Math.min(100, (s.totalStudyMin / (topStudents[0]?.totalStudyMin || 1)) * 100)}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-xs text-gray-500 w-16 text-right">
                                    {s.totalStudyMin}분
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, sub, icon, color }: {
    label: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <div className={`p-3 rounded-xl border ${color}`}>
            <div className="flex items-center gap-1 mb-1">
                {icon}
                <span className="text-xs text-gray-500">{label}</span>
            </div>
            <div className="text-xl font-bold text-gray-800">{value}</div>
            <div className="text-[10px] text-gray-400">{sub}</div>
        </div>
    );
}
