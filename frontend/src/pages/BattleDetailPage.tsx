import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Swords, Clock, Trophy, ArrowLeft, Copy, CheckCircle, Play, Send, Loader2, XCircle, Timer } from 'lucide-react';
import { examBattleApi } from '../lib/api';
import { useAuthStore } from '../stores';

interface BattleResult {
    id: number;
    participantId: string;
    participantNickname: string | null;
    rawScore: number | null;
    standardScore: number | null;
    grade: number | null;
    percentile: number | null;
    isWinner: boolean | null;
    submittedAt: string | null;
    timeTakenMin: number | null;
}

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
    results: BattleResult[];
}

const examTypeLabels: Record<string, string> = {
    education_office: '교육청',
    evaluation_board: '평가원',
    sunung: '수능',
    private: '사설',
};

export default function BattleDetailPage() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { isLoggedIn } = useAuthStore();
    const memberId = localStorage.getItem('accessToken') ? JSON.parse(atob(localStorage.getItem('accessToken')!.split('.')[1])).jti : null;

    const [battle, setBattle] = useState<Battle | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

    // 점수 입력 상태
    const [scoreForm, setScoreForm] = useState({
        rawScore: '',
        standardScore: '',
        grade: '',
        percentile: '',
        timeTakenMin: '',
    });

    const loadBattle = useCallback(async () => {
        if (!code) return;
        try {
            const res = await examBattleApi.getBattleByCode(code);
            setBattle(res.data);

            // 타이머 계산
            if (res.data.status === 'in_progress' && res.data.startTime) {
                const start = new Date(res.data.startTime).getTime();
                const limitMs = res.data.timeLimitMin * 60 * 1000;
                const remaining = Math.max(0, Math.floor((start + limitMs - Date.now()) / 1000));
                setTimerSeconds(remaining);
            }
        } catch (e) {
            console.error('Failed to load battle:', e);
        } finally {
            setLoading(false);
        }
    }, [code]);

    useEffect(() => {
        loadBattle();
    }, [loadBattle]);

    // 타이머 카운트다운
    useEffect(() => {
        if (timerSeconds === null || timerSeconds <= 0) return;
        const interval = setInterval(() => {
            setTimerSeconds(prev => {
                if (prev === null || prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [timerSeconds]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const copyInviteLink = () => {
        if (!battle) return;
        const url = `${window.location.origin}/battle/${battle.battleCode}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAccept = async () => {
        if (!battle) return;
        setActionLoading(true);
        try {
            await examBattleApi.accept(battle.id);
            await loadBattle();
        } catch (e) {
            console.error('Failed to accept:', e);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!battle) return;
        setActionLoading(true);
        try {
            await examBattleApi.reject(battle.id);
            await loadBattle();
        } catch (e) {
            console.error('Failed to reject:', e);
        } finally {
            setActionLoading(false);
        }
    };

    const handleStart = async () => {
        if (!battle) return;
        setActionLoading(true);
        try {
            await examBattleApi.start(battle.id);
            await loadBattle();
        } catch (e) {
            console.error('Failed to start:', e);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmitScore = async () => {
        if (!battle) return;
        setActionLoading(true);
        try {
            await examBattleApi.submitScore(battle.id, {
                rawScore: scoreForm.rawScore ? parseFloat(scoreForm.rawScore) : undefined,
                standardScore: scoreForm.standardScore ? parseInt(scoreForm.standardScore) : undefined,
                grade: scoreForm.grade ? parseInt(scoreForm.grade) : undefined,
                percentile: scoreForm.percentile ? parseInt(scoreForm.percentile) : undefined,
                timeTakenMin: scoreForm.timeTakenMin ? parseInt(scoreForm.timeTakenMin) : undefined,
            });
            await loadBattle();
        } catch (e) {
            console.error('Failed to submit score:', e);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    if (!battle) {
        return (
            <div className="text-center py-20">
                <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">배틀을 찾을 수 없습니다</p>
                <button onClick={() => navigate('/battle')} className="mt-4 text-orange-500 underline text-sm">
                    배틀 목록으로 돌아가기
                </button>
            </div>
        );
    }

    const isChallenger = memberId === battle.challengerId;
    const isOpponent = memberId === battle.opponentId;
    const isParticipant = isChallenger || isOpponent;
    const myResult = battle.results.find(r => r.participantId === memberId);
    const opponentResult = battle.results.find(r => r.participantId !== memberId);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* 뒤로가기 */}
            <button onClick={() => navigate('/battle')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
                <ArrowLeft className="w-4 h-4" />
                배틀 목록
            </button>

            {/* 배틀 헤더 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                {examTypeLabels[battle.examType] || battle.examType}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${battle.status === 'completed' ? 'bg-purple-50 text-purple-600' :
                                    battle.status === 'in_progress' ? 'bg-emerald-50 text-emerald-600' :
                                        battle.status === 'accepted' ? 'bg-blue-50 text-blue-600' :
                                            battle.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                                                'bg-yellow-50 text-yellow-600'
                                }`}>
                                {battle.status === 'pending' ? '대기 중' :
                                    battle.status === 'accepted' ? '수락됨' :
                                        battle.status === 'in_progress' ? '진행 중' :
                                            battle.status === 'completed' ? '완료' : '취소됨'}
                            </span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">{battle.examName}</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            {new Date(battle.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={copyInviteLink}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
                        >
                            {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            {copied ? '복사됨' : '링크 복사'}
                        </button>
                    </div>
                </div>

                {/* 배틀 정보 */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {battle.timeLimitMin}분
                    </span>
                    {battle.betEnabled && (
                        <span className="flex items-center gap-1 text-orange-600">
                            🎲 {battle.betDescription || '내기'}
                        </span>
                    )}
                </div>
            </div>

            {/* 타이머 (진행 중) */}
            {battle.status === 'in_progress' && timerSeconds !== null && (
                <div className={`rounded-2xl p-8 text-center ${timerSeconds > 300 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                    <Timer className={`w-8 h-8 mx-auto mb-2 ${timerSeconds > 300 ? 'text-emerald-500' : 'text-red-500 animate-pulse'}`} />
                    <div className={`text-5xl font-mono font-bold ${timerSeconds > 300 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {formatTime(timerSeconds)}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">남은 시간</p>
                </div>
            )}

            {/* 대결 뷰 (결과 비교) */}
            {battle.results.length >= 2 && battle.status === 'completed' && (
                <div className="bg-gradient-to-r from-orange-50 via-white to-blue-50 border border-gray-200 rounded-2xl p-6">
                    <h2 className="text-center text-sm font-medium text-gray-500 mb-6">배틀 결과</h2>
                    <div className="grid grid-cols-3 gap-4 items-center">
                        {/* Player 1 */}
                        <div className={`text-center ${battle.results[0].isWinner ? 'scale-105' : ''}`}>
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                {battle.results[0].isWinner && <Trophy className="w-8 h-8 text-orange-500" />}
                                {battle.results[0].isWinner === false && <span className="text-2xl">😢</span>}
                                {battle.results[0].isWinner === null && <span className="text-2xl">🤝</span>}
                            </div>
                            <div className="text-xs text-gray-400 mb-1">{battle.results[0].participantId.slice(0, 6)}...</div>
                            <div className="text-3xl font-bold text-gray-900">{battle.results[0].rawScore ?? '-'}</div>
                            <div className="text-xs text-gray-400 mt-1">
                                {battle.results[0].isWinner ? '🏆 승리' : battle.results[0].isWinner === false ? '패배' : '무승부'}
                            </div>
                        </div>

                        {/* VS */}
                        <div className="text-center">
                            <div className="text-2xl font-black text-gray-300">VS</div>
                        </div>

                        {/* Player 2 */}
                        <div className={`text-center ${battle.results[1].isWinner ? 'scale-105' : ''}`}>
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                {battle.results[1].isWinner && <Trophy className="w-8 h-8 text-blue-500" />}
                                {battle.results[1].isWinner === false && <span className="text-2xl">😢</span>}
                                {battle.results[1].isWinner === null && <span className="text-2xl">🤝</span>}
                            </div>
                            <div className="text-xs text-gray-400 mb-1">{battle.results[1].participantId.slice(0, 6)}...</div>
                            <div className="text-3xl font-bold text-gray-900">{battle.results[1].rawScore ?? '-'}</div>
                            <div className="text-xs text-gray-400 mt-1">
                                {battle.results[1].isWinner ? '🏆 승리' : battle.results[1].isWinner === false ? '패배' : '무승부'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 액션 영역 */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                {/* 대기 중 - 상대방에게 수락/거절 보이기 */}
                {battle.status === 'pending' && !isChallenger && isLoggedIn && (
                    <div className="text-center">
                        <Swords className="w-10 h-10 text-orange-400 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-900 mb-1">배틀 초대를 받았습니다!</h3>
                        <p className="text-sm text-gray-500 mb-4">수락하고 대결을 시작하세요</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleAccept}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors text-sm"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                수락
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={actionLoading}
                                className="py-2.5 px-6 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                거절
                            </button>
                        </div>
                    </div>
                )}

                {/* 대기 중 - 신청자에게 링크 공유 안내 */}
                {battle.status === 'pending' && isChallenger && (
                    <div className="text-center">
                        <Clock className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-900 mb-1">상대방을 기다리는 중...</h3>
                        <p className="text-sm text-gray-500 mb-4">아래 링크를 공유하여 상대방을 초대하세요</p>
                        <button
                            onClick={copyInviteLink}
                            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-5 rounded-xl transition-colors text-sm"
                        >
                            {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            {copied ? '링크가 복사되었습니다!' : '초대 링크 복사'}
                        </button>
                    </div>
                )}

                {/* 수락됨 - 시작 버튼 */}
                {battle.status === 'accepted' && isParticipant && (
                    <div className="text-center">
                        <Play className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-900 mb-1">배틀 준비 완료!</h3>
                        <p className="text-sm text-gray-500 mb-4">시작 버튼을 눌러 타이머를 시작하세요</p>
                        <button
                            onClick={handleStart}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
                        >
                            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                            배틀 시작!
                        </button>
                    </div>
                )}

                {/* 진행 중 - 점수 입력 */}
                {(battle.status === 'in_progress' || battle.status === 'accepted') && isParticipant && !myResult?.submittedAt && (
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Send className="w-5 h-5 text-orange-500" />
                            점수 입력
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">원점수</label>
                                <input
                                    type="number"
                                    value={scoreForm.rawScore}
                                    onChange={(e) => setScoreForm({ ...scoreForm, rawScore: e.target.value })}
                                    placeholder="100"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">표준점수</label>
                                <input
                                    type="number"
                                    value={scoreForm.standardScore}
                                    onChange={(e) => setScoreForm({ ...scoreForm, standardScore: e.target.value })}
                                    placeholder="140"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">등급</label>
                                <input
                                    type="number"
                                    value={scoreForm.grade}
                                    onChange={(e) => setScoreForm({ ...scoreForm, grade: e.target.value })}
                                    placeholder="1"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">백분위</label>
                                <input
                                    type="number"
                                    value={scoreForm.percentile}
                                    onChange={(e) => setScoreForm({ ...scoreForm, percentile: e.target.value })}
                                    placeholder="96"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSubmitScore}
                            disabled={actionLoading || !scoreForm.rawScore}
                            className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
                        >
                            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            점수 제출
                        </button>
                    </div>
                )}

                {/* 이미 제출한 경우 */}
                {isParticipant && myResult?.submittedAt && battle.status !== 'completed' && (
                    <div className="text-center">
                        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-900 mb-1">점수를 제출했습니다!</h3>
                        <p className="text-sm text-gray-500">상대방의 제출을 기다리고 있습니다...</p>
                    </div>
                )}

                {/* 완료 */}
                {battle.status === 'completed' && (
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => navigate('/battle')}
                            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors text-sm"
                        >
                            <Swords className="w-4 h-4" />
                            다시 배틀하기
                        </button>
                    </div>
                )}

                {/* 취소됨 */}
                {battle.status === 'cancelled' && (
                    <div className="text-center">
                        <XCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="font-bold text-gray-900 mb-1">배틀이 취소되었습니다</h3>
                        <button
                            onClick={() => navigate('/battle')}
                            className="mt-3 text-orange-500 underline text-sm"
                        >
                            배틀 목록으로
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
