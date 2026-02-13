import { useState, useEffect, useRef } from 'react';
import { Users, Flame, HandMetal, Trophy, Send, Loader2 } from 'lucide-react';
import { activityApi } from '../lib/api';

interface OnlineMember {
    memberId: number;
    subject: string;
    since: string;
}

interface Props {
    arenaId: number;
    myMemberId: number;
}

const CHEER_TYPES = [
    { type: 'fire', icon: '🔥', label: '불꽃' },
    { type: 'sticker', icon: '👏', label: '칭찬' },
    { type: 'trophy', icon: '🏆', label: '트로피' },
];

export function OnlineMembers({ arenaId, myMemberId }: Props) {
    const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
    const [cheerCount, setCheerCount] = useState(0);
    const [cheerLimit] = useState(10);
    const [selectedMember, setSelectedMember] = useState<number | null>(null);
    const [sendingCheer, setSendingCheer] = useState(false);
    const [cheerToast, setCheerToast] = useState<string | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        loadOnline();
        loadCheerCount();

        // 30초마다 하트비트
        heartbeatRef.current = setInterval(() => {
            activityApi.heartbeat(myMemberId, arenaId, '학습 중').catch(() => { });
            loadOnline();
        }, 30_000);

        // 최초 하트비트
        activityApi.heartbeat(myMemberId, arenaId, '학습 중').catch(() => { });

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
    }, [arenaId, myMemberId]);

    const loadOnline = async () => {
        try {
            const { data } = await activityApi.getOnlineMembers(arenaId);
            setOnlineMembers(data);
        } catch { /* ignore */ }
    };

    const loadCheerCount = async () => {
        try {
            const { data } = await activityApi.getTodayCheerCount(myMemberId);
            setCheerCount(data.count);
        } catch { /* ignore */ }
    };

    const sendCheer = async (receiverId: number, type: string) => {
        if (cheerCount >= cheerLimit) return;
        setSendingCheer(true);
        try {
            await activityApi.sendCheer({
                arenaId,
                senderId: myMemberId,
                receiverId,
                type,
            });
            setCheerCount((c) => c + 1);
            setCheerToast(`${CHEER_TYPES.find(t => t.type === type)?.icon} 응원 보냈습니다!`);
            setTimeout(() => setCheerToast(null), 2000);
            setSelectedMember(null);
        } catch { /* ignore */ }
        setSendingCheer(false);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-500" />
                    지금 학습 중
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {onlineMembers.length}명
                    </span>
                </h2>
                <div className="text-xs text-gray-400">
                    응원 {cheerCount}/{cheerLimit}
                </div>
            </div>

            {/* 토스트 */}
            {cheerToast && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl text-sm text-center animate-pulse">
                    {cheerToast}
                </div>
            )}

            {/* 온라인 멤버 */}
            {onlineMembers.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                    현재 접속 중인 멤버가 없습니다
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {onlineMembers.map((member) => (
                        <div
                            key={member.memberId}
                            className="relative"
                        >
                            <button
                                onClick={() =>
                                    member.memberId !== myMemberId &&
                                    setSelectedMember(
                                        selectedMember === member.memberId ? null : member.memberId,
                                    )
                                }
                                className={`w-full p-3 rounded-xl border transition-all text-left ${selectedMember === member.memberId
                                    ? 'border-arena-400 bg-arena-50 shadow-md'
                                    : 'border-gray-100 bg-white hover:border-arena-200'
                                    } ${member.memberId === myMemberId ? 'ring-2 ring-arena-300' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-sm font-medium text-gray-800 truncate">
                                        멤버 #{member.memberId}
                                        {member.memberId === myMemberId && ' (나)'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 pl-4">
                                    📖 {member.subject}
                                </div>
                            </button>

                            {/* 응원 버튼  */}
                            {selectedMember === member.memberId && (
                                <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-2 z-10 animate-in fade-in slide-in-from-top-2">
                                    {CHEER_TYPES.map((ct) => (
                                        <button
                                            key={ct.type}
                                            disabled={sendingCheer || cheerCount >= cheerLimit}
                                            onClick={() => sendCheer(member.memberId, ct.type)}
                                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm hover:bg-gray-50 shadow-lg disabled:opacity-50 transition-all active:scale-95"
                                            title={ct.label}
                                        >
                                            {ct.icon}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
