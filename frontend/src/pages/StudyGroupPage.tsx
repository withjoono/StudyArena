
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, ArrowRight } from 'lucide-react';
import { getMyStudyGroups, createStudyGroup, joinStudyGroup } from '../lib/study-group-api';

export default function StudyGroupPage() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [joinCode, setJoinCode] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            // Guest mode
            return;
        }
        loadGroups();
    }, []);

    const isLoggedIn = !!localStorage.getItem('accessToken');

    const loadGroups = async () => {
        try {
            const data = await getMyStudyGroups();
            if (Array.isArray(data)) setGroups(data);
        } catch (error) {
            console.error('Failed to load groups', error);
        }
    };

    // if (!isLoggedIn) {
    //     // Blocking UI removed per request. Showing UI with limited functionality.
    // }

    const handleCreate = async () => {
        if (!isLoggedIn) {
            alert('로그인해야 이용할 수 있습니다.');
            return;
        }
        if (!newGroupName.trim()) return;
        try {
            await createStudyGroup(newGroupName);
            setNewGroupName('');
            setIsCreating(false);
            loadGroups();
        } catch (error) {
            alert('Failed to create group');
        }
    };

    const handleJoin = async () => {
        if (!isLoggedIn) {
            alert('로그인해야 이용할 수 있습니다.');
            return;
        }
        if (!joinCode.trim()) return;
        try {
            const res = await joinStudyGroup(joinCode);
            if (res.success) {
                setJoinCode('');
                loadGroups();
            }
        } catch (error) {
            alert('Failed to join group. Check code.');
        }
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        스터디 그룹
                    </h1>
                    <p className="text-gray-400 mt-2">함께 공부하고 성장하는 공간</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    <span>새 그룹 만들기</span>
                </button>
            </div>

            {isCreating && (
                <div className="bg-slate-800/50 p-6 rounded-xl border border-indigo-500/30 mb-8 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4">새로운 그룹 만들기</h3>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="그룹 이름을 입력하세요"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                            onClick={handleCreate}
                            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-lg"
                        >
                            생성
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users size={20} />
                    <span>초대 코드로 참여하기</span>
                </h3>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="초대 코드 입력 (예: AB12C)"
                        className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 w-64 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                        onClick={handleJoin}
                        className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg"
                    >
                        참여
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group: any) => (
                    <div
                        key={group.id}
                        onClick={() => navigate(`/study-group/${group.id}`)}
                        className="bg-slate-800 border border-slate-700 rounded-xl p-6 cursor-pointer hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                <Users size={24} />
                            </div>
                            <span className="bg-slate-900 text-xs px-2 py-1 rounded text-gray-400">
                                {new Date(group.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{group.name}</h3>
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                            {group.description || '스터디 그룹입니다.'}
                        </p>
                        <div className="flex items-center text-indigo-400 text-sm font-medium gap-1">
                            <span>입장하기</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                ))}
            </div>

            {groups.length === 0 && !isCreating && (
                <div className="text-center py-20 text-gray-500">
                    참여 중인 스터디 그룹이 없습니다.
                </div>
            )}
        </div>
    );
}
