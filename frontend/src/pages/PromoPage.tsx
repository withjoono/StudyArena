import { Link } from 'react-router-dom';
import { Target, GraduationCap, Users, Swords, Zap, ArrowRight, Sparkles, Trophy, Clock, BarChart3 } from 'lucide-react';
import { redirectToLogin } from '../lib/auth';

const services = [
    {
        title: '동일목표반',
        subtitle: '같은 대학, 같은 꿈',
        description: '같은 대학을 목표로 하는 학생들끼리 매일 학습량으로 경쟁하세요.',
        features: ['일간 통계', '주간 통계', '월간 통계', '리더보드 & 랭킹'],
        icon: Target,
        color: 'orange',
        gradient: 'from-orange-500 to-amber-500',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-600',
        link: '/arena/create',
    },
    {
        title: '담당선생님반',
        subtitle: '체계적 학습 관리',
        description: '선생님이 반을 만들고, 학생들을 넣어 학습을 체계적으로 관리합니다.',
        features: ['학습 관리', '일간 통계', '주간 통계', '월간 통계'],
        icon: GraduationCap,
        color: 'indigo',
        gradient: 'from-indigo-500 to-violet-500',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        text: 'text-indigo-600',
        link: '/teacher-class',
    },
    {
        title: '스터디그룹',
        subtitle: '함께 공부하자',
        description: '학생들끼리 스터디그룹을 결성하고, 구성원들끼리 학습 경쟁!',
        features: ['일간 통계', '주간 통계', '월간 통계', '모의사 테스트'],
        icon: Users,
        color: 'blue',
        gradient: 'from-blue-500 to-cyan-500',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        link: '/study-group',
    },
    {
        title: '모의고사배틀',
        subtitle: '1:1 모의고사 대결',
        description: '다른 학생에게 모의고사 배틀을 신청하고, 수락 시 바로 대결 시행!',
        features: ['배틀 신청', '점수 비교', '전적 관리', '내기 시스템'],
        icon: Swords,
        color: 'rose',
        gradient: 'from-rose-500 to-pink-500',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-600',
        link: '/battle',
    },
    {
        title: '스터디 배틀',
        subtitle: '실시간 공부 시합',
        description: '배틀 참석자는 휴대폰을 켜놓고, 누가 더 오래 공부하는지 시합!',
        features: ['실시간 타이머', '학습 시간 대결', '라이브 현황', '결과 기록'],
        icon: Zap,
        color: 'emerald',
        gradient: 'from-emerald-500 to-teal-500',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-600',
        link: '/study-battle',
    },
];

export default function PromoPage() {
    return (
        <div className="space-y-10">
            {/* 히어로 */}
            <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 rounded-3xl p-8 md:p-12">
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/3 blur-2xl" />
                <div className="relative z-10 text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                        <Sparkles className="w-4 h-4" />
                        학습 경쟁 플랫폼
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                        Study Arena
                    </h1>
                    <p className="text-white/90 text-base md:text-lg max-w-lg mx-auto mb-8">
                        친구들과 학습 성과를 비교하고, 건전한 경쟁을 통해 함께 성장하는 학습 플랫폼
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={redirectToLogin}
                            className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-8 py-3 rounded-xl shadow-lg shadow-orange-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Trophy className="w-5 h-5" />
                            로그인하고 시작하기
                        </button>
                    </div>
                </div>
            </div>

            {/* 숫자 통계 */}
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white border border-gray-200 rounded-xl">
                    <div className="text-2xl md:text-3xl font-extrabold text-orange-500">5</div>
                    <div className="text-xs text-gray-500 mt-1">서비스</div>
                </div>
                <div className="text-center p-4 bg-white border border-gray-200 rounded-xl">
                    <div className="text-2xl md:text-3xl font-extrabold text-indigo-500 flex items-center justify-center gap-1">
                        <Clock className="w-5 h-5" /> 24/7
                    </div>
                    <div className="text-xs text-gray-500 mt-1">실시간 경쟁</div>
                </div>
                <div className="text-center p-4 bg-white border border-gray-200 rounded-xl">
                    <div className="text-2xl md:text-3xl font-extrabold text-emerald-500 flex items-center justify-center gap-1">
                        <BarChart3 className="w-5 h-5" /> 3종
                    </div>
                    <div className="text-xs text-gray-500 mt-1">통계 기간</div>
                </div>
            </div>

            {/* 5개 서비스 카드 */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">서비스 소개</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {services.map((svc) => (
                        <Link
                            key={svc.title}
                            to={svc.link}
                            className={`group relative bg-white border ${svc.border} rounded-2xl p-6 hover:shadow-lg hover:shadow-${svc.color}-100 transition-all duration-300`}
                        >
                            {/* 아이콘 */}
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${svc.gradient} flex items-center justify-center mb-4 text-white shadow-md`}>
                                <svc.icon className="w-6 h-6" />
                            </div>

                            {/* 제목 */}
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{svc.title}</h3>
                            <p className={`text-xs font-medium ${svc.text} mb-2`}>{svc.subtitle}</p>
                            <p className="text-sm text-gray-500 mb-4 leading-relaxed">{svc.description}</p>

                            {/* 기능 태그 */}
                            <div className="flex flex-wrap gap-1.5">
                                {svc.features.map((f) => (
                                    <span key={f} className={`${svc.bg} ${svc.text} text-xs font-medium px-2 py-0.5 rounded-md`}>
                                        {f}
                                    </span>
                                ))}
                            </div>

                            {/* 화살표 */}
                            <div className={`absolute top-6 right-6 ${svc.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* CTA 하단 */}
            <div className="text-center bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-8">
                <p className="text-gray-600 mb-4">지금 바로 Study Arena에서 경쟁을 시작하세요! 🚀</p>
                <button
                    onClick={redirectToLogin}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl shadow-md transition-all active:scale-95"
                >
                    무료로 시작하기
                </button>
            </div>
        </div>
    );
}
