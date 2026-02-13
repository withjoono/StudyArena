import { useState, useEffect } from 'react';
import { Award, Sparkles, Lock, Loader2 } from 'lucide-react';
import { badgeApi } from '../lib/api';

interface BadgeDef {
    id: number;
    code: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: string;
}

interface EarnedBadge {
    id: number;
    earnedAt: string;
    badge: BadgeDef;
}

const RARITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    common: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600' },
    rare: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
    epic: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
    legendary: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
};

const CATEGORY_LABELS: Record<string, string> = {
    streak: '🔥 연속',
    time: '⏰ 시간',
    mission: '🎯 미션',
    social: '👥 소셜',
    league: '🏆 리그',
    general: '✨ 일반',
};

interface Props {
    memberId: number;
}

export function BadgeCollection({ memberId }: Props) {
    const [allBadges, setAllBadges] = useState<BadgeDef[]>([]);
    const [myBadges, setMyBadges] = useState<EarnedBadge[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [memberId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [allRes, myRes] = await Promise.all([
                badgeApi.getAll(),
                badgeApi.getMyBadges(memberId),
            ]);
            setAllBadges(allRes.data);
            setMyBadges(myRes.data);
        } catch { /* ignore */ }
        setLoading(false);
    };

    const earnedCodes = new Set(myBadges.map(b => b.badge.code));
    const categories = Array.from(new Set(allBadges.map(b => b.category)));

    const filteredBadges = selectedCategory
        ? allBadges.filter(b => b.category === selectedCategory)
        : allBadges;

    if (loading) {
        return (
            <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-500" />
                    배지 컬렉션
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {myBadges.length}/{allBadges.length}
                    </span>
                </h2>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex gap-1 overflow-x-auto pb-1">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${!selectedCategory
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    전체
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {CATEGORY_LABELS[cat] || cat}
                    </button>
                ))}
            </div>

            {/* 배지 그리드 */}
            <div className="grid grid-cols-3 gap-3">
                {filteredBadges.map(badge => {
                    const earned = earnedCodes.has(badge.code);
                    const rarityStyle = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;

                    return (
                        <div
                            key={badge.code}
                            className={`relative p-3 rounded-xl border-2 text-center transition-all ${earned
                                ? `${rarityStyle.bg} ${rarityStyle.border} shadow-sm`
                                : 'bg-gray-50 border-gray-100 opacity-50'
                                }`}
                        >
                            <span className={`text-2xl ${earned ? '' : 'grayscale'}`}>
                                {badge.icon}
                            </span>
                            <div className={`text-xs font-semibold mt-1 ${earned ? rarityStyle.text : 'text-gray-400'}`}>
                                {badge.name}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                                {badge.description}
                            </div>
                            {!earned && (
                                <Lock className="absolute top-1 right-1 w-3 h-3 text-gray-300" />
                            )}
                            {earned && badge.rarity === 'legendary' && (
                                <Sparkles className="absolute top-1 right-1 w-3 h-3 text-amber-400" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
