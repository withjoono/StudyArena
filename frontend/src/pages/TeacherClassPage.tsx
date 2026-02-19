import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, BookOpen, Loader2, ChevronRight, Plus } from 'lucide-react';
import { arenaApi } from '../lib/api';
import { useAuthStore } from '../stores';
import { redirectToLogin } from '../lib/auth';

interface Arena {
    id: number;
    name: string;
    description: string | null;
    memberCount: number;
    inviteCode: string;
}

export default function TeacherClassPage() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuthStore();
    const [arenas, setArenas] = useState<Arena[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isLoggedIn) {
            loadArenas();
        } else {
            setLoading(false);
        }
    }, [isLoggedIn]);

    const loadArenas = async () => {
        try {
            const res = await arenaApi.getMyArenas();
            setArenas(res.data || []);
        } catch (e) {
            console.error('Failed to load arenas:', e);
        } finally {
            setLoading(false);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="space-y-8">
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-8 md:p-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-500 text-white rounded-xl">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">선생님 관리</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">담당선생님반</h1>
                        <p className="text-gray-600 max-w-md mb-6">
                            담당 선생님이 관리하는 학습반에 참여하여 체계적인 학습 관리를 받아보세요.
                        </p>
                        <button
                            onClick={redirectToLogin}
                            className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                        >
                            <Users className="w-5 h-5" />
                            로그인하고 참여하기
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <GraduationCap className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">선생님 직접 관리</h3>
                        <p className="text-sm text-gray-500">담당 선생님이 학습 진도와 성적을 직접 관리합니다</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">맞춤형 학습</h3>
                        <p className="text-sm text-gray-500">개인별 학습 현황에 맞는 맞춤 피드백을 받으세요</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                        <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Users className="w-6 h-6 text-pink-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">반 단위 활동</h3>
                        <p className="text-sm text-gray-500">같은 반 학생들과 함께 학습하며 동기부여를 받아보세요</p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <GraduationCap className="w-7 h-7 text-indigo-500" />
                    담당선생님반
                </h1>
                <button
                    onClick={() => navigate('/arena/join')}
                    className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm"
                >
                    <Plus className="w-4 h-4" />
                    초대코드로 참여
                </button>
            </div>

            {arenas.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">아직 참여한 선생님반이 없습니다</p>
                    <p className="text-sm text-gray-400">선생님에게 초대 코드를 받아 참여하세요</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {arenas.map((arena) => (
                        <div
                            key={arena.id}
                            onClick={() => navigate(`/arena/${arena.id}/teacher`)}
                            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{arena.name}</h3>
                                    {arena.description && (
                                        <p className="text-sm text-gray-500 mt-0.5">{arena.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" /> {arena.memberCount}명
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
