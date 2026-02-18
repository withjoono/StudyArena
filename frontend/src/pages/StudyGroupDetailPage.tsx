
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudyGroupDetails, inviteStudyGroup, getGroupComments, addGroupComment } from '../lib/study-group-api';
import { Users, Calendar, Award, MessageSquare, Copy, BookOpen } from 'lucide-react';

export default function StudyGroupDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadDetails();
            loadComments();
        }
    }, [id, selectedDate]);

    const loadDetails = async () => {
        if (!id) return;
        try {
            // @ts-ignore
            const data = await getStudyGroupDetails(id);
            setGroup(data);
        } catch (error) {
            console.error(error);
            // navigate('/study-group'); // Don't redirect, let UI handle no data
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        if (!id) return;
        // @ts-ignore
        try {
            const data = await getGroupComments(id, selectedDate);
            if (Array.isArray(data)) setComments(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleInvite = async () => {
        try {
            // @ts-ignore
            const res = await inviteStudyGroup(id);
            if (res.inviteCode) {
                navigator.clipboard.writeText(res.inviteCode);
                alert(`초대 코드 복사됨: ${res.inviteCode}`);
            }
        } catch (error) {
            alert('초대 코드 생성 실패 (권한이 없거나 오류)');
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            // Default target: Comment on the group for the selected date. 
            // Since API requires targetMemberId, we might default to owner or find a way to represent "Group".
            // However, the schema supports targetMemberId. 
            // For now, let's pick the first member (e.g. owner) or the current user themselves as placeholder,
            // OR finding a specific "Group Board" member? 
            // A better approach for "Group Wall" is having a NULL targetMemberId in schema, but schema says it's a relation.
            // WORKAROUND: Send comment to the Group Owner for now.
            // @ts-ignore
            const targetId = group.ownerId; // Send to owner

            // @ts-ignore
            await addGroupComment(id, targetId, selectedDate, newComment);
            setNewComment('');
            loadComments();
        } catch (error) {
            console.error(error);
            alert('메시지 등록 실패');
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    // If loading failed (likely 401) and no group data
    if (!group) {
        return (
            <div className="p-10 text-center">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">로그인이 필요한 페이지입니다</h2>
                <p className="text-gray-500 mb-6">스터디 그룹의 상세 정보를 보시려면 로그인이 필요합니다.</p>
                <div className="card-glass p-8 max-w-2xl mx-auto opacity-50 pointer-events-none blur-sm select-none">
                    {/* Mock UI to show "Frontend Screen" structure */}
                    <div className="h-8 bg-gray-300 w-1/3 mb-4 rounded"></div>
                    <div className="h-4 bg-gray-200 w-1/2 mb-8 rounded"></div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            STUDY GROUP
                        </span>
                        <span className="text-gray-500 text-sm">{new Date(group.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">{group.name}</h1>
                    <p className="text-gray-400">{group.description || '함께 공부하는 멤버들과 소통하며 성장하세요.'}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleInvite}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-lg transition-colors"
                    >
                        <Copy size={18} />
                        <span>초대코드 복사</span>
                    </button>
                    {/* Add more actions if needed */}
                </div>
            </div>

            {/* Member Stats Grid */}
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Users className="text-indigo-400" />
                <span>멤버 현황 ({group.members.length})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                {group.members.map((member: any) => (
                    <div key={member.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-colors">
                        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg">
                                    {member.nickname[0]}
                                </div>
                                <div>
                                    <div className="font-bold">{member.nickname}</div>
                                    <div className="text-xs text-gray-400 capitalize">{member.role}</div>
                                </div>
                            </div>
                            {/* Placeholder for interactions */}
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-4 text-sm text-gray-400">
                                <span>최근 학습 기록</span>
                            </div>
                            <div className="space-y-3">
                                {member.snapshots && member.snapshots.length > 0 ? (
                                    member.snapshots.map((snap: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">{new Date(snap.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-indigo-300">{snap.totalStudyMin}분</span>
                                                <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500" style={{ width: `${Math.min(snap.achievementPct, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 py-4 text-sm">기록 없음</div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Comments Section */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <MessageSquare className="text-indigo-400" />
                    <span>응원 한마디</span>
                </h3>

                <div className="flex gap-4 mb-6">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="멤버들에게 응원의 메시지를 남겨보세요!"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button
                        onClick={handleAddComment}
                        className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-lg"
                    >
                        등록
                    </button>
                </div>

                <div className="space-y-4">
                    {comments.map((comment: any) => (
                        <div key={comment.id} className="bg-slate-900/50 p-4 rounded-lg flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm">
                                {(comment.writerName || '?')[0]}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm">{comment.writerName}</span>
                                    <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="text-gray-300">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                    {comments.length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                            아직 작성된 메시지가 없습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* Spacer */}
            <div className="h-20"></div>
        </div>
    );
}
