
import { Link } from 'react-router-dom';
import { Plus, Users, Swords } from 'lucide-react';

export default function PromoPage() {
    return (
        <div className="space-y-8">
            {/* 히어로 — 알림 박스 패턴 */}
            <div className="relative overflow-hidden bg-gradient-to-r from-arena-50 to-arena-100 border border-arena-200 rounded-2xl p-8 md:p-10">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-arena-500/10 rounded-full blur-3xl" />
                <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                        <Swords className="w-8 h-8 text-arena-500" />
                        <h1 className="text-3xl md:text-4xl font-extrabold text-arena-700">
                            StudyArena
                        </h1>
                    </div>
                    <p className="text-arena-700/70 text-lg max-w-xl">
                        클래스 친구들과 매일 학습 성과를 비교하고, 서로 경쟁하며 성장하세요.
                    </p>
                    <div className="flex gap-3 mt-6">
                        <a href="http://localhost:3000/login" className="bg-arena-500 hover:bg-arena-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-arena-500/25 active:scale-95 flex items-center gap-2">
                            로그인하고 시작하기
                        </a>
                        <Link to="/arena/join" className="border border-arena-500 text-arena-500 hover:bg-arena-50 font-medium px-5 py-2 rounded-xl transition-all duration-200 active:scale-95 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            초대 코드로 참여
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="card-glass p-6">
                    <div className="w-12 h-12 bg-arena-100 rounded-xl flex items-center justify-center mb-4 text-arena-600">
                        <Swords className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">선의의 경쟁</h3>
                    <p className="text-gray-500 text-sm">
                        친구들과 학습 시간을 비교하며
                        <br />
                        건전한 경쟁심을 길러보세요.
                    </p>
                </div>
                <div className="card-glass p-6">
                    <div className="w-12 h-12 bg-arena-100 rounded-xl flex items-center justify-center mb-4 text-arena-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">함께하는 성장</h3>
                    <p className="text-gray-500 text-sm">
                        혼자 공부하기 힘들 때,
                        <br />
                        같은 목표를 가진 친구들과 함께해요.
                    </p>
                </div>
                <div className="card-glass p-6">
                    <div className="w-12 h-12 bg-arena-100 rounded-xl flex items-center justify-center mb-4 text-arena-600">
                        <Plus className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">간편한 시작</h3>
                    <p className="text-gray-500 text-sm">
                        복잡한 절차 없이
                        <br />
                        초대 코드만으로 바로 참여하세요.
                    </p>
                </div>
            </div>
        </div>
    );
}
