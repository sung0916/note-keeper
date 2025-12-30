import { useState } from "react";
import { Search, Check, UserCircle2 } from "lucide-react";
import { useFriendList } from "../../hooks/useFriendList";
import { supabase } from "../../supabase";

interface ShareMemoModalProps {
    isOpen: boolean;
    onClose: () => void;
    noteId: number;
    userId: string | null;
}

export default function ShareMemoModal({ isOpen, onClose, noteId, userId }: ShareMemoModalProps) {
    const [searchText, setSearchText] = useState("");
    const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
    const [isSharing, setIsSharing] = useState(false);

    const { friends, isLoading } = useFriendList(userId);

    if (!isOpen) return null;

    // 검색 필터링
    const filteredFriends = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchText.toLowerCase()) ||
        friend.googleId.toLowerCase().includes(searchText.toLowerCase())
    );

    const toggleSelect = (friendUserId: string) => {
        const newSet = new Set(selectedFriendIds);
        if (newSet.has(friendUserId)) {
            newSet.delete(friendUserId);
        } else {
            newSet.add(friendUserId);
        }
        setSelectedFriendIds(newSet);
    };

    const handleShare = async () => {
        if (selectedFriendIds.size === 0 || !userId) return;
        setIsSharing(true);

        try {
            // 중복 공유 체크
            const receiverIds = Array.from(selectedFriendIds);
            const { data: existingShares, error: checkError } = await supabase
                .from('note_shares')
                .select('guest_id')
                .eq('note_id', noteId)
                .in('guest_id', receiverIds)
                .in('status', ['PENDING', 'ACCEPTED']);

            if (checkError) throw checkError;

            const existingGuestIds = new Set(existingShares?.map(s => s.guest_id));
            const newGuestIds = receiverIds.filter(id => !existingGuestIds.has(id));

            if (existingGuestIds.size > 0) {
                alert("이미 공유 중이거나 공유된 사용자가 포함되어 있습니다.");
                if (newGuestIds.length === 0) {
                    setIsSharing(false);
                    return;
                }
            }

            const shares = newGuestIds.map(receiverId => ({
                note_id: noteId,
                guest_id: receiverId,
                status: 'PENDING',
                permission: 'READ'
            }));

            const { error } = await supabase
                .from('note_shares')
                .insert(shares);

            if (error) throw error;

            alert(`${newGuestIds.length}명에게 메모를 공유했습니다.`);
            onClose();
            setSelectedFriendIds(new Set());
        } catch (e) {
            console.error("공유 실패:", e);
            alert("공유 중 오류가 발생했습니다.");
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-[90%] max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-5 pb-2">
                    <h2 className="text-lg font-bold text-gray-900">친구 선택</h2>
                </div>

                {/* Search */}
                <div className="px-5 py-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="이름 검색..."
                            className="w-full bg-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>

                {/* Friend List */}
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="py-8 text-center text-gray-400 text-sm">로딩 중...</div>
                    ) : filteredFriends.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-sm">
                            {searchText ? "검색 결과가 없습니다." : "친구가 없습니다."}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredFriends.map(friend => (
                                <div
                                    key={friend.friendUserId}
                                    onClick={() => toggleSelect(friend.friendUserId)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                                >
                                    {/* Avatar */}
                                    <div className="relative w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100">
                                        {friend.avatarUrl ? (
                                            <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <UserCircle2 className="w-full h-full text-gray-400" />
                                        )}
                                        {/* Status indicator could go here */}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{friend.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{friend.googleId}</p>
                                    </div>

                                    {/* Checkbox */}
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedFriendIds.has(friend.friendUserId)
                                        ? "bg-blue-500 border-blue-500"
                                        : "border-gray-200 group-hover:border-blue-400"
                                        }`}>
                                        {selectedFriendIds.has(friend.friendUserId) && (
                                            <Check size={14} className="text-white" strokeWidth={3} />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 pt-3 border-t bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={selectedFriendIds.size === 0 || isSharing}
                        className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors shadow-md disabled:bg-blue-300 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isSharing ? "공유 중..." : `공유하기 ${selectedFriendIds.size > 0 ? selectedFriendIds.size : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
