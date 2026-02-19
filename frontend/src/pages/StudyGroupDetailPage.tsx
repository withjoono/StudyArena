import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Users, Calendar, Trophy, MessageSquare, Copy, ChevronLeft,
    Crown, Medal, Clock, Target
} from 'lucide-react';
import {
    getStudyGroupDetails, inviteStudyGroup, getGroupLeaderboard,
    getGroupComments, addGroupComment
} from '../lib/study-group-api';

type Period = 'daily' | 'weekly' | 'monthly';
const periodLabels: Record<Period, string> = { daily: '일간', weekly: '주간', monthly: '월간' };

function formatStudyTime(min: number) {
    if (min < 60) return `${min}분`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

function getRankIcon(rank: number) {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-400">{rank}</span>;
}

export default function StudyGroupDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [group, setGroup] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [period, setPeriod] = useState<Period>('daily');
    const [tab, setTab] = useState<'ranking' | 'comments'>('ranking');
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadDetails();
            loadLeaderboard();
        }
    }, [id]);

    useEffect(() => {
        if (id) loadLeaderboard();
    }, [period]);

    const loadDetails = async () => {
        try {
            const data = await getStudyGroupDetails(id!);
            setGroup(data);
        } catch { navigate('/study-group'); }
        finally { setLoading(false); }
    };

    const loadLeaderboard = async () => {
        try {
            const data = await getGroupLeaderboard(id!, period);
            if (Array.isArray(data)) setLeaderboard(data);
        } catch (e) { console.error('Leaderboard error', e); }
    };

    const loadComments = async () => {
        try {
            const data = await getGroupComments(id!);
            if (Array.isArray(data)) setComments(data);
        } catch { }
    };

    const handleInvite = async () => {
        try {
            const data = await inviteStudyGroup(id!);
            setInviteCode(data.inviteCode);
            navigator.clipboard.writeText(data.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { alert('초대 코드 생성에 실패했습니다.'); }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !group?.members?.[0]) return;
        try {
            await addGroupComment(
                id!,
                group.members[0].id,
                new Date().toISOString().split('T')[0],
                newComment,
            );
            setNewComment('');
            loadComments();
        } catch { alert('댓글 작성에 실패했습니다.'); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!group) return null;

    // 그룹 총 통계
    const totalStudyMin = group.members?.reduce((sum: number, m: any) =>
        sum + (m.snapshots?.reduce((s: number, sn: any) => s + (sn.totalStudyMin || 0), 0) || 0), 0) || 0;
    const avgAchievement = group.members?.length > 0
        ? Math.round(group.members.reduce((sum: number, m: any) =>
            sum + (m.snapshots?.[0]?.achievementPct || 0), 0) / group.members.length)
        : 0;

    return (
        <div className="space-y-6">
            {/* 뒤로가기 */}
            <button onClick={() => navigate('/study-group')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm transition-colors">
                <ChevronLeft className="w-4 h-4" />
                스터디 그룹 목록
            </button>

            {/* 그룹 헤더 */}
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">{group.name}</h1>
                    <button
                        onClick={handleInvite}
                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Copy className="w-4 h-4" />
                        {copied ? '복사됨!' : inviteCode || '초대 코드'}
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                        <Users className="w-5 h-5 mx-auto mb-1 opacity-80" />
                        <div className="text-xl font-bold">{group.members?.length || 0}</div>
                        <div className="text-xs opacity-70">구성원</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                        <Clock className="w-5 h-5 mx-auto mb-1 opacity-80" />
                        <div className="text-xl font-bold">{formatStudyTime(totalStudyMin)}</div>
                        <div className="text-xs opacity-70">총 학습시간</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                        <Target className="w-5 h-5 mx-auto mb-1 opacity-80" />
                        <div className="text-xl font-bold">{avgAchievement}%</div>
                        <div className="text-xs opacity-70">평균 달성률</div>
                    </div>
                </div>
            </div>

            {/* 탭 */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                    onClick={() => { setTab('ranking'); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'ranking' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Trophy className="w-4 h-4" /> 랭킹
                </button>
                <button
                    onClick={() => { setTab('comments'); loadComments(); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'comments' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <MessageSquare className="w-4 h-4" /> 댓글
                </button>
            </div>

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
                                <p>아직 학습 데이터가 없습니다.</p>
                                <p className="text-sm mt-1">StudyPlanner에서 학습을 시작하세요!</p>
                            </div>
                        ) : (
                            leaderboard.map((entry) => (
                                <div key={entry.memberId} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                                    {/* 순위 */}
                                    <div className="w-8 flex justify-center">{getRankIcon(entry.rank)}</div>
                                    {/* 정보 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900 truncate">
                                            학생 #{entry.studentId || entry.memberId}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatStudyTime(entry.totalStudyMin)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Target className="w-3 h-3" />
                                                달성 {entry.achievementPct}%
                                            </span>
                                        </div>
                                    </div>
                                    {/* 점수 */}
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

            {/* 댓글 탭 */}
            {tab === 'comments' && (
                <div className="space-y-4">
                    {/* 댓글 입력 */}
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="응원 메시지를 남겨보세요..."
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <button
                            onClick={handleAddComment}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            등록
                        </button>
                    </div>

                    {/* 댓글 목록 */}
                    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                        {comments.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>아직 댓글이 없습니다.</p>
                            </div>
                        ) : (
                            comments.map((c: any) => (
                                <div key={c.id} className="p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm text-gray-900">{c.writerName || '익명'}</span>
                                        <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">{c.content}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
