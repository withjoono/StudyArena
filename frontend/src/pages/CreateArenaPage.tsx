import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Sparkles } from 'lucide-react';
import { arenaApi } from '../lib/api';

export default function CreateArenaPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isLoggedIn = !!localStorage.getItem('accessToken');
        if (!isLoggedIn) {
            setError('로그인해야 이용할 수 있습니다.');
            return;
        }
        if (!name.trim()) {
            setError('아레나 이름을 입력해주세요.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data } = await arenaApi.createArena({
                name: name.trim(),
                description: description.trim() || undefined,
            });
            navigate(`/arena/${data.id}`);
        } catch (err: any) {
            setError(err.response?.data?.message || '아레나 생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto">
            <div className="card-glass p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-arena-500 rounded-xl flex items-center justify-center">
                        <Swords className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Arena(스터디그룹) 만들기</h1>
                        <p className="text-sm text-gray-500">클래스 친구들과 학습 경쟁을 시작하세요</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            아레나 이름 <span className="text-arena-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="예: 고2 수학반 A"
                            className="input-field w-full"
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            설명 <span className="text-gray-400">(선택)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="아레나에 대한 설명을 입력하세요"
                            className="input-field w-full h-24 resize-none"
                            maxLength={500}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-arena-500 hover:bg-arena-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-arena-500/25 active:scale-95 w-full flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                아레나 생성
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 p-4 bg-gradient-to-r from-arena-50 to-arena-100 border border-arena-200 rounded-xl">
                    <p className="text-xs text-arena-700 leading-relaxed">
                        💡 아레나를 만들면 <strong>초대 코드</strong>가 자동 생성됩니다.
                        이 코드를 친구들에게 공유하면 바로 참여할 수 있어요!
                    </p>
                </div>
            </div>
        </div>
    );
}
