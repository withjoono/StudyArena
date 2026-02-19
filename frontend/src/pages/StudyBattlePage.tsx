import { Zap, Target, TrendingUp } from 'lucide-react';

export default function StudyBattlePage() {
    return (
        <div className="space-y-8">
            {/* 히어로 섹션 */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-8 md:p-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500 text-white rounded-xl">
                            <Zap className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">🔜 준비 중</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">스터디 배틀</h1>
                    <p className="text-gray-600 max-w-lg mb-6">
                        학습 시간, 문제 풀이 수, 연속 학습일 등 다양한 학습 지표로 친구와 실시간 대결!
                        건전한 경쟁을 통해 학습 의지를 불태워보세요. 곧 만나볼 수 있습니다! 🚀
                    </p>
                    <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 font-medium py-2 px-4 rounded-xl text-sm">
                        <Zap className="w-4 h-4" />
                        곧 출시 예정
                    </div>
                </div>
            </div>

            {/* 기능 소개 카드 */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">학습시간 대결</h3>
                    <p className="text-sm text-gray-500">정해진 기간 동안 누가 더 많이 공부하는지 겨뤄보세요</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Target className="w-6 h-6 text-teal-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">문제풀이 배틀</h3>
                    <p className="text-sm text-gray-500">같은 단원의 문제를 누가 더 많이, 정확히 풀 수 있을까?</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-6 h-6 text-cyan-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">성장 챌린지</h3>
                    <p className="text-sm text-gray-500">연속 학습일 / 목표 달성률로 서로 도전해보세요</p>
                </div>
            </div>
        </div>
    );
}
