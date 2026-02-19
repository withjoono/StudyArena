import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Zap, Target, TrendingUp, Clock, Trophy, Users, Flame,
    ArrowRight, Swords, Crown, Medal, Timer
} from 'lucide-react';
import { useAuthStore } from '../stores';
import { redirectToLogin } from '../lib/auth';
import { arenaApi, leaderboardApi } from '../lib/api';

type Period = 'daily' | 'weekly' | 'monthly';
const periodLabels: Record<Period, string> = { daily: '오늘', weekly: '이번 주', monthly: '이번 달' };

function formatStudyTime(min: number) {
    if (!min) return '0분';
    if (min < 60) return `${min}분`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

export default function StudyBattlePage() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuthStore();
    const [arenas, setArenas] = useState<any[]>([]);
    const [selectedArena, setSelectedArena] = useState<number | null>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [period, setPeriod] = useState<Period>('daily');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isLoggedIn) loadArenas();
    }, [isLoggedIn]);

    useEffect(() => {
        if (selectedArena) loadLeaderboard();
    }, [selectedArena, period]);

    const loadArenas = async () => {
        try {
            const res = await arenaApi.getMyArenas();
            const list = res.data || [];
            setArenas(list);
            if (list.length > 0) setSelectedArena(list[0].id);
        } catch { }
    };

    const loadLeaderboard = async () => {
        if (!selectedArena) return;
        setLoading(true);
        try {
            const res = await leaderboardApi.getLeaderboard(selectedArena, period);
            setLeaderboard(res.data || []);
        } catch { setLeaderboard([]); }
        setLoading(false);
    };

    // 비로그인
    if (!isLoggedIn) {
        return (
            <div className="space-y-8">
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-8 md:p-12 text-center">
                    <div className="absolute top-0 right-0 w-60 h-60 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
                    <div className="relative z-10 max-w-lg mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                            <Flame className="w-4 h-4" />
                            실시간 경쟁
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">스터디 배틀</h1>
                        <p className="text-white/80 mb-6">
                            학습시간, 달성률로 친구들과 실시간 대결! 건전한 경쟁으로 학습 동기를 불태우세요.
                        </p>
                        <button onClick={redirectToLogin} className="bg-white text-emerald-600 font-bold px-8 py-3 rounded-xl shadow-lg transition-all active:scale-95">
                            로그인하고 시작하기
                        </button>
                    </div>
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                    {[
                        { title: '학습시간 대결', desc: '정해진 기간 동안 누가 더 많이 공부하는지!', icon: Clock, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                        { title: '달성률 배틀', desc: '같은 아레나에서 목표 달성률로 경쟁', icon: Target, bg: 'bg-teal-50', text: 'text-teal-600' },
                        { title: '성장 챌린지', desc: '일간·주간·월간 리더보드에서 순위를 올려라', icon: TrendingUp, bg: 'bg-cyan-50', text: 'text-cyan-600' },
                    ].map(f => (
                        <div key={f.title} className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-3 ${f.text}`}>
                                <f.icon className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                            <p className="text-sm text-gray-500">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Top 3
    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-1">
                    <Swords className="w-6 h-6" />
                    <h1 className="text-2xl font-bold">스터디 배틀</h1>
                </div>
                <p className="text-white/70 text-sm mb-4">아레나 내 학습 경쟁 리더보드</p>

                {/* 아레나 선택 */}
                {arenas.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {arenas.map((a: any) => (
                            <button
                                key={a.id}
                                onClick={() => setSelectedArena(a.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedArena === a.id
                                    ? 'bg-white text-emerald-600'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                            >
                                {a.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* 기간 선택 */}
                <div className="flex gap-2">
                    {(Object.entries(periodLabels) as [Period, string][]).map(([p, label]) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${period === p
                                ? 'bg-white text-emerald-600'
                                : 'bg-white/15 text-white/80 hover:bg-white/25'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 모의고사 배틀 바로가기 */}
            <div
                onClick={() => navigate('/battle')}
                className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                        <Timer className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900">모의고사 배틀</div>
                        <div className="text-xs text-gray-500">1:1 실시간 모의고사 대결</div>
                    </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                    <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-1">아직 학습 데이터가 없습니다</p>
                    <p className="text-sm text-gray-400">StudyPlanner에서 학습을 기록하면 여기에 표시됩니다</p>
                </div>
            ) : (
                <>
                    {/* 🏆 Top 3 포디엄 */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500" /> {periodLabels[period]} Top 3
                        </h3>
                        <div className="flex items-end justify-center gap-4 mb-4">
                            {/* 2nd */}
                            {top3[1] && (
                                <div className="text-center flex-1 max-w-[120px]">
                                    <div className="bg-gray-100 rounded-xl p-3 mb-2">
                                        <Medal className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                                        <div className="font-bold text-gray-900 text-sm truncate">학생 #{top3[1].studentId || top3[1].memberId}</div>
                                        <div className="text-xs text-gray-500">{formatStudyTime(top3[1].totalStudyMin)}</div>
                                    </div>
                                    <div className="bg-gray-200 rounded-t-lg h-16 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-gray-500">2</span>
                                    </div>
                                </div>
                            )}
                            {/* 1st */}
                            {top3[0] && (
                                <div className="text-center flex-1 max-w-[130px]">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-2">
                                        <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-1" />
                                        <div className="font-bold text-gray-900 text-sm truncate">학생 #{top3[0].studentId || top3[0].memberId}</div>
                                        <div className="text-xs text-gray-500">{formatStudyTime(top3[0].totalStudyMin)}</div>
                                        <div className="text-lg font-bold text-emerald-600">{top3[0].score}점</div>
                                    </div>
                                    <div className="bg-yellow-400 rounded-t-lg h-24 flex items-center justify-center">
                                        <span className="text-3xl font-bold text-white">1</span>
                                    </div>
                                </div>
                            )}
                            {/* 3rd */}
                            {top3[2] && (
                                <div className="text-center flex-1 max-w-[120px]">
                                    <div className="bg-orange-50 rounded-xl p-3 mb-2">
                                        <Medal className="w-8 h-8 text-amber-600 mx-auto mb-1" />
                                        <div className="font-bold text-gray-900 text-sm truncate">학생 #{top3[2].studentId || top3[2].memberId}</div>
                                        <div className="text-xs text-gray-500">{formatStudyTime(top3[2].totalStudyMin)}</div>
                                    </div>
                                    <div className="bg-amber-600 rounded-t-lg h-12 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-white">3</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 나머지 순위 */}
                    {rest.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                            {rest.map((entry: any) => (
                                <div key={entry.memberId} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                                    <div className="w-8 text-center">
                                        <span className="text-sm font-bold text-gray-400">{entry.rank}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900 truncate">학생 #{entry.studentId || entry.memberId}</div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                            <span><Clock className="w-3 h-3 inline mr-0.5" />{formatStudyTime(entry.totalStudyMin)}</span>
                                            <span><Target className="w-3 h-3 inline mr-0.5" />달성 {entry.achievementPct}%</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-emerald-600">{entry.score}</div>
                                        <div className="text-xs text-gray-400">점</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {arenas.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">참여 중인 아레나가 없습니다</p>
                    <p className="text-sm text-gray-400">아레나에 참여하면 학습 배틀을 시작할 수 있습니다</p>
                    <button
                        onClick={() => navigate('/arena')}
                        className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    >
                        아레나 탐색하기
                    </button>
                </div>
            )}
        </div>
    );
}
