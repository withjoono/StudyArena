import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Trophy, Plus, Clock, CheckCircle, XCircle, Loader2, ChevronRight, Target, Flame } from 'lucide-react';
import { examBattleApi } from '../lib/api';
import { useAuthStore } from '../stores';
import { redirectToLogin } from '../lib/auth';

interface Battle {
    id: number;
    battleCode: string;
    challengerId: string;
    opponentId: string | null;
    opponentNickname: string | null;
    status: string;
    examType: string;
    examName: string;
    betEnabled: boolean;
    betAmount: number | null;
    betDescription: string | null;
    startTime: string | null;
    endTime: string | null;
    timeLimitMin: number;
    createdAt: string;
    results: {
        id: number;
        participantId: string;
        rawScore: number | null;
        isWinner: boolean | null;
        submittedAt: string | null;
    }[];
}

interface BattleRecord {
    memberId: string;
    totalBattles: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    avgScore: number;
    bestScore: number;
    currentStreak: number;
    maxStreak: number;
}

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: '대기 중', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: Clock },
    accepted: { label: '수락됨', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: CheckCircle },
    in_progress: { label: '진행 중', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: Loader2 },
    completed: { label: '완료', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: Trophy },
    cancelled: { label: '취소됨', color: 'text-gray-500 bg-gray-50 border-gray-200', icon: XCircle },
};

const examTypeLabels: Record<string, string> = {
    education_office: '교육청',
    evaluation_board: '평가원',
    sunung: '수능',
    private: '사설',
};

export default function BattlePage() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuthStore();
    const [battles, setBattles] = useState<Battle[]>([]);
    const [record, setRecord] = useState<BattleRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);

    // 생성 폼 상태
    const [form, setForm] = useState({
        examType: 'evaluation_board',
        examName: '',
        timeLimitMin: 90,
        betEnabled: false,
        betDescription: '',
    });

    useEffect(() => {
        if (isLoggedIn) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [isLoggedIn]);

    const loadData = async () => {
        try {
            const [battlesRes, recordRes] = await Promise.all([
                examBattleApi.getMyBattles(),
                examBattleApi.getMyRecord(),
            ]);
            setBattles(battlesRes.data);
            setRecord(recordRes.data);
        } catch (e) {
            console.error('Failed to load battle data:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!form.examName.trim()) return;
        setCreating(true);
        try {
            const res = await examBattleApi.create({
                examType: form.examType,
                examName: form.examName,
                timeLimitMin: form.timeLimitMin,
                betEnabled: form.betEnabled,
                betDescription: form.betEnabled ? form.betDescription : undefined,
            });
            navigate(`/battle/${res.data.battleCode}`);
        } catch (e) {
            console.error('Failed to create battle:', e);
        } finally {
            setCreating(false);
        }
    };

    // ─── 비로그인 히어로 ───
    if (!isLoggedIn) {
        return (
            <div className="space-y-8">
                <div className="relative overflow-hidden bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-8 md:p-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-500 text-white rounded-xl">
                                <Swords className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">1:1 대결</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">모의고사 배틀</h1>
                        <p className="text-gray-600 max-w-md mb-6">
                            친구와 같은 모의고사를 동시에 풀고, 실시간으로 결과를 비교해보세요. 건전한 경쟁이 실력 향상의 지름길입니다!
                        </p>
                        <button
                            onClick={redirectToLogin}
                            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                        >
                            <Swords className="w-5 h-5" />
                            로그인하고 배틀 시작
                        </button>
                    </div>
                </div>

                {/* 기능 소개 */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Target className="w-6 h-6 text-orange-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">동일 시험 대결</h3>
                        <p className="text-sm text-gray-500">같은 모의고사를 동시에 풀어 공정하게 실력을 비교합니다</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Flame className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">내기 시스템</h3>
                        <p className="text-sm text-gray-500">커피 한 잔부터 포인트까지, 동기부여를 위한 내기를 걸어보세요</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Trophy className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">전적 & 랭킹</h3>
                        <p className="text-sm text-gray-500">승패 기록과 연승 기록을 통해 성장 과정을 확인하세요</p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── 로딩 ───
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* 헤더 & 전적 요약 */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* 타이틀 + 생성 버튼 */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Swords className="w-7 h-7 text-orange-500" />
                            모의고사 배틀
                        </h1>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            배틀 신청
                        </button>
                    </div>
                </div>

                {/* 전적 카드 */}
                {record && record.totalBattles > 0 && (
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-5 min-w-[280px]">
                        <div className="text-sm font-medium opacity-80 mb-2">내 전적</div>
                        <div className="flex items-baseline gap-1 mb-3">
                            <span className="text-3xl font-bold">{record.wins}</span>
                            <span className="text-lg opacity-80">승</span>
                            <span className="text-3xl font-bold ml-2">{record.losses}</span>
                            <span className="text-lg opacity-80">패</span>
                            {record.draws > 0 && (
                                <>
                                    <span className="text-3xl font-bold ml-2">{record.draws}</span>
                                    <span className="text-lg opacity-80">무</span>
                                </>
                            )}
                        </div>
                        <div className="flex gap-4 text-sm opacity-90">
                            <span>승률 {record.winRate.toFixed(1)}%</span>
                            <span>🔥 {record.currentStreak}연승</span>
                            <span>최고 {record.bestScore}점</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 배틀 생성 폼 */}
            {showCreate && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">새 배틀 만들기</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">시험 종류</label>
                            <select
                                value={form.examType}
                                onChange={(e) => setForm({ ...form, examType: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="education_office">교육청 모의고사</option>
                                <option value="evaluation_board">평가원 모의고사</option>
                                <option value="sunung">수능</option>
                                <option value="private">사설 모의고사</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">시험 이름</label>
                            <input
                                type="text"
                                value={form.examName}
                                onChange={(e) => setForm({ ...form, examName: e.target.value })}
                                placeholder="예: 2025년 6월 평가원 모의고사"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">제한 시간 (분)</label>
                            <input
                                type="number"
                                value={form.timeLimitMin}
                                onChange={(e) => setForm({ ...form, timeLimitMin: parseInt(e.target.value) || 90 })}
                                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.betEnabled}
                                    onChange={(e) => setForm({ ...form, betEnabled: e.target.checked })}
                                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm text-gray-700">내기 걸기</span>
                            </label>
                            {form.betEnabled && (
                                <input
                                    type="text"
                                    value={form.betDescription}
                                    onChange={(e) => setForm({ ...form, betDescription: e.target.value })}
                                    placeholder="예: 커피 한 잔"
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            )}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleCreate}
                                disabled={creating || !form.examName.trim()}
                                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors text-sm"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
                                배틀 생성
                            </button>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="py-2.5 px-5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 배틀 목록 */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">배틀 목록</h2>
                {battles.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                        <Swords className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">아직 참여한 배틀이 없습니다</p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            첫 배틀 만들기
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {battles.map((battle) => {
                            const statusInfo = statusLabels[battle.status] || statusLabels.pending;
                            const StatusIcon = statusInfo.icon;
                            return (
                                <div
                                    key={battle.id}
                                    onClick={() => navigate(`/battle/${battle.battleCode}`)}
                                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusInfo.label}
                                                </span>
                                                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                                                    {examTypeLabels[battle.examType] || battle.examType}
                                                </span>
                                                {battle.betEnabled && (
                                                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                                        🎲 내기
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-gray-900 truncate">{battle.examName}</h3>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {new Date(battle.createdAt).toLocaleDateString('ko-KR')} · 코드: {battle.battleCode}
                                            </div>
                                        </div>
                                        {/* 결과 미리보기 */}
                                        {battle.status === 'completed' && battle.results.length >= 2 && (
                                            <div className="flex items-center gap-3 mx-4">
                                                {battle.results.map((r, i) => (
                                                    <div key={r.id} className={`text-center ${r.isWinner ? 'text-orange-600' : 'text-gray-400'}`}>
                                                        <div className="text-lg font-bold">{r.rawScore ?? '-'}</div>
                                                        <div className="text-[10px]">{r.isWinner ? '승' : r.isWinner === false ? '패' : '무'}</div>
                                                        {i === 0 && <span className="text-gray-300 text-lg absolute ml-4">vs</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-400 transition-colors flex-shrink-0" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
