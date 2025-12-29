import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { Crown, X, User } from "lucide-react";
import type { Note, UserProfile } from "../../types";

interface ParticipantsModalProps {
    isOpen: boolean;
    onClose: () => void;
    note: Note;
}

interface Participant extends UserProfile {
    role: 'owner' | 'viewer' | 'editor';
}

export default function ParticipantsModal({ isOpen, onClose, note }: ParticipantsModalProps) {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const fetchParticipants = async () => {
            setIsLoading(true);
            try {
                // 1. 작성자 정보 (Owner)
                const owner: Participant = {
                    id: note.writer_id,
                    email: note.users?.email || '',
                    nickname: note.users?.nickname || 'Unknown',
                    avatar_url: note.users?.avatar_url,
                    role: 'owner'
                };

                // 2. 공유받고 수락한 없는 사용자들
                const { data, error } = await supabase
                    .from('note_shares')
                    .select(`
                        guest_id,
                        permission,
                        users:guest_id (
                            id,
                            email,
                            nickname,
                            avatar_url
                        )
                    `)
                    .eq('note_id', note.note_id)
                    .eq('status', 'ACCEPTED');

                if (error) throw error;

                const sharedUsers: Participant[] = (data || []).map((item: any) => ({
                    id: item.users.id,
                    email: item.users.email,
                    nickname: item.users.nickname,
                    avatar_url: item.users.avatar_url,
                    role: item.permission === 'edit' ? 'editor' : 'viewer'
                }));

                setParticipants([owner, ...sharedUsers]);
            } catch (e) {
                console.error("Failed to fetch participants:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchParticipants();
    }, [isOpen, note]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xs bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 bottom-20">
                <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        참여자 목록 <span className="text-gray-400 text-sm font-normal">({participants.length})</span>
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400 text-xs">로딩 중...</div>
                    ) : (
                        <div className="space-y-1">
                            {participants.map((user) => (
                                <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="relative w-10 h-10">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.nickname} className="w-full h-full rounded-full object-cover border border-gray-200" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                <User size={20} />
                                            </div>
                                        )}
                                        {user.role === 'owner' && (
                                            <div className="absolute -top-1 -right-1 bg-yellow-400 text-white p-0.5 rounded-full border-2 border-white shadow-sm" title="작성자">
                                                <Crown size={10} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-sm text-gray-800 truncate">{user.nickname || "이름 없음"}</span>
                                            {user.role === 'owner' && (
                                                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded">OWNER</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate">{user.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
