import { useState, useEffect } from 'react';
import { Settings, Users, BarChart3, Trash2, RotateCcw, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { adminApi } from '../lib/api';

interface SystemStats {
    arenas: number;
    activeMembers: number;
    totalSnapshots: number;
}

interface MemberEntry {
    id: number;
    studentId: number;
    hubMemberId: number | null;
    role: string;
    isActive: boolean;
    joinedAt: string;
}

interface Props {
    arenaId: number;
}

export function AdminPanel({ arenaId }: Props) {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [members, setMembers] = useState<MemberEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmAction, setConfirmAction] = useState<string | null>(null);

    useEffect(() => { loadData(); }, [arenaId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsRes, membersRes] = await Promise.all([
                adminApi.getStats(),
                adminApi.getMembers(arenaId),
            ]);
            setStats(statsRes.data);
            setMembers(membersRes.data || []);
        } catch { /* ignore */ }
        setLoading(false);
    };

    const handleSeasonReset = async () => {
        try {
            await adminApi.resetSeason(arenaId);
            setConfirmAction(null);
            loadData();
        } catch { /* ignore */ }
    };

    const handleRemoveMember = async (memberId: number) => {
        try {
            await adminApi.removeMember(memberId);
            loadData();
        } catch { /* ignore */ }
    };

    const handleChangeRole = async (memberId: number, role: string) => {
        try {
            await adminApi.changeRole(memberId, role);
            loadData();
        } catch { /* ignore */ }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <Settings className="h-5 w-5 text-gray-500" />
                관리자 패널
            </h2>

            {/* 시스템 통계 */}
            {stats && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 p-3 border border-indigo-100">
                        <div className="text-xs text-indigo-400">아레나 수</div>
                        <div className="text-xl font-bold text-indigo-700">{stats.arenas}</div>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-3 border border-emerald-100">
                        <div className="text-xs text-emerald-400">활성 멤버</div>
                        <div className="text-xl font-bold text-emerald-700">{stats.activeMembers}</div>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-3 border border-amber-100">
                        <div className="text-xs text-amber-400">스냅샷</div>
                        <div className="text-xl font-bold text-amber-700">{stats.totalSnapshots}</div>
                    </div>
                </div>
            )}

            {/* 작업 버튼 */}
            <div className="flex gap-2">
                <button
                    onClick={() => setConfirmAction('reset')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-all"
                >
                    <RotateCcw className="h-4 w-4" /> 시즌 리셋
                </button>
                <button
                    onClick={() => setConfirmAction('cleanup')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition-all"
                >
                    <Trash2 className="h-4 w-4" /> 데이터 정리
                </button>
            </div>

            {/* 확인 다이얼로그 */}
            {confirmAction && (
                <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-bold text-red-700">
                            {confirmAction === 'reset' ? '시즌을 리셋하시겠습니까?' : '90일 이전 데이터를 삭제하시겠습니까?'}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                if (confirmAction === 'reset') handleSeasonReset();
                                else adminApi.cleanup().then(() => { setConfirmAction(null); loadData(); });
                            }}
                            className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600"
                        >
                            확인
                        </button>
                        <button
                            onClick={() => setConfirmAction(null)}
                            className="flex-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}

            {/* 멤버 관리 */}
            <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Users className="h-4 w-4 text-gray-400" />
                    멤버 관리 ({members.length}명)
                </h3>
                <div className="space-y-2">
                    {members.map(m => (
                        <div key={m.id} className={`flex items-center gap-3 rounded-xl p-3 border ${m.isActive ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-50'}`}>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                                <Users className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800">학생 #{m.studentId}</div>
                                <div className="text-[10px] text-gray-400">
                                    {new Date(m.joinedAt).toLocaleDateString('ko')} · {m.role}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {m.role !== 'admin' && (
                                    <button
                                        onClick={() => handleChangeRole(m.id, m.role === 'leader' ? 'member' : 'leader')}
                                        className="rounded-lg p-1.5 text-gray-300 hover:bg-indigo-50 hover:text-indigo-500"
                                        title="역할 변경"
                                    >
                                        <Shield className="h-3.5 w-3.5" />
                                    </button>
                                )}
                                {m.isActive && (
                                    <button
                                        onClick={() => handleRemoveMember(m.id)}
                                        className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                                        title="멤버 제거"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
