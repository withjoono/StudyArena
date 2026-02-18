import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, KeyRound } from 'lucide-react';
import { arenaApi } from '../lib/api';

export default function JoinArenaPage() {
    const navigate = useNavigate();
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isLoggedIn = !!localStorage.getItem('accessToken');
        if (!isLoggedIn) {
            setError('로그인해야 이용할 수 있습니다.');
            return;
        }
        if (!inviteCode.trim()) {
            setError('초대 코드를 입력해주세요.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data } = await arenaApi.joinArena(inviteCode.trim().toUpperCase());
            navigate(`/arena/${data.arenaId}`);
        } catch (err: any) {
            setError(err.response?.data?.message || '참여에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto">
            <div className="card-glass p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-arena-500 rounded-xl flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">아레나 참여</h1>
                        <p className="text-sm text-gray-500">초대 코드로 아레나에 참여하세요</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            초대 코드 <span className="text-arena-500">*</span>
                        </label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                placeholder="6자리 코드 입력"
                                className="input-field w-full pl-11 text-center text-xl font-mono tracking-[0.3em] uppercase"
                                maxLength={6}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || inviteCode.length < 6}
                        className="bg-arena-500 hover:bg-arena-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-arena-500/25 active:scale-95 w-full flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4" />
                                참여하기
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 p-4 bg-gradient-to-r from-arena-50 to-arena-100 border border-arena-200 rounded-xl">
                    <p className="text-xs text-arena-700 leading-relaxed">
                        💡 초대 코드는 아레나 관리자가 공유해줍니다.
                        대소문자 구분 없이 6자리 코드를 입력하세요.
                    </p>
                </div>
            </div>
        </div>
    );
}
