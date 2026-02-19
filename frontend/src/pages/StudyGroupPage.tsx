import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, ArrowRight, UserPlus, Sparkles } from 'lucide-react';
import { getMyStudyGroups, createStudyGroup, joinStudyGroup } from '../lib/study-group-api';
import { useAuthStore } from '../stores';
import { redirectToLogin } from '../lib/auth';

export default function StudyGroupPage() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuthStore();
    const [groups, setGroups] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [joinCode, setJoinCode] = useState('');

    useEffect(() => {
        if (isLoggedIn) loadGroups();
    }, [isLoggedIn]);

    const loadGroups = async () => {
        try {
            const data = await getMyStudyGroups();
            if (Array.isArray(data)) setGroups(data);
        } catch (error) {
            console.error('Failed to load groups', error);
        }
    };

    const handleCreate = async () => {
        if (!isLoggedIn) { redirectToLogin(); return; }
        if (!newGroupName.trim()) return;
        try {
            await createStudyGroup(newGroupName);
            setNewGroupName('');
            setIsCreating(false);
            loadGroups();
        } catch { alert('그룹 생성에 실패했습니다.'); }
    };

    const handleJoin = async () => {
        if (!isLoggedIn) { redirectToLogin(); return; }
        if (!joinCode.trim()) return;
        try {
            const res = await joinStudyGroup(joinCode);
            if (res.success) { setJoinCode(''); loadGroups(); }
        } catch { alert('참여에 실패했습니다. 코드를 확인하세요.'); }
    };

    // 비로그인 히어로
    if (!isLoggedIn) {
        return (
            <div className="space-y-8">
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 rounded-3xl p-8 md:p-12 text-center">
                    <div className="absolute top-0 right-0 w-60 h-60 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
                    <div className="relative z-10 max-w-lg mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                            <Sparkles className="w-4 h-4" />
                            학습 동료 찾기
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">스터디 그룹</h1>
                        <p className="text-white/80 mb-6">친구들과 스터디그룹을 결성하고, 일간·주간·월간 학습 경쟁을 시작하세요.</p>
                        <button onClick={redirectToLogin} className="bg-white text-indigo-600 font-bold px-8 py-3 rounded-xl shadow-lg transition-all active:scale-95">
                            로그인하고 시작하기
                        </button>
                    </div>
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                    {[
                        { title: '그룹 생성', desc: '이름만 입력하면 바로 그룹 생성', icon: Plus, bg: 'bg-blue-50', text: 'text-blue-600' },
                        { title: '코드로 참여', desc: '초대 코드만 입력하면 즉시 합류', icon: UserPlus, bg: 'bg-indigo-50', text: 'text-indigo-600' },
                        { title: '경쟁 통계', desc: '일간·주간·월간 리더보드와 차트', icon: Users, bg: 'bg-violet-50', text: 'text-violet-600' },
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

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">스터디 그룹</h1>
                    <p className="text-gray-500 text-sm mt-1">함께 공부하고 경쟁하며 성장하는 공간</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    새 그룹
                </button>
            </div>

            {/* 생성 폼 */}
            {isCreating && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">새로운 그룹 만들기</h3>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="그룹 이름을 입력하세요"
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                        <button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                            생성
                        </button>
                    </div>
                </div>
            )}

            {/* 초대 코드 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-indigo-500" />
                    초대 코드로 참여하기
                </h3>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="초대 코드 (예: AB12C)"
                        className="border border-gray-300 rounded-lg px-4 py-2 w-60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase tracking-wider"
                        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    />
                    <button onClick={handleJoin} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                        참여
                    </button>
                </div>
            </div>

            {/* 그룹 목록 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group: any) => (
                    <div
                        key={group.id}
                        onClick={() => navigate(`/study-group/${group.id}`)}
                        className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white">
                                <Users className="w-5 h-5" />
                            </div>
                            <span className="bg-gray-100 text-xs px-2 py-1 rounded-md text-gray-500">
                                {new Date(group.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{group.name}</h3>
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                            {group.description || '스터디 그룹입니다.'}
                        </p>
                        <div className="flex items-center text-indigo-500 text-sm font-medium gap-1">
                            <span>입장하기</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                ))}
            </div>

            {groups.length === 0 && !isCreating && (
                <div className="text-center py-16">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">참여 중인 스터디 그룹이 없습니다.</p>
                    <p className="text-gray-400 text-sm mt-1">새 그룹을 만들거나 초대 코드로 참여하세요.</p>
                </div>
            )}
        </div>
    );
}
