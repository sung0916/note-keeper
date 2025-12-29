import { ArrowLeft, MoreVertical, Search, UserPlus, Check, UserCircle2, Copy, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useFriendList } from "../../hooks/useFriendList";
import { supabase } from "../../supabase";
import { type SearchUserResult } from "../../types";

interface FriendListModalProps {
    onClose: () => void;
    currentUser: {
        name: string;
        avatarUrl?: string;
        id?: string;
    };
}

export default function FriendListModal({ onClose, currentUser }: FriendListModalProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [selectedFriends, setSelectedFriends] = useState<Set<number>>(new Set());
    const [showMenu, setShowMenu] = useState(false);

    // 친구 추가 모달 상태
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addSearchEmail, setAddSearchEmail] = useState("");
    const [searchResult, setSearchResult] = useState<SearchUserResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // 실제 친구 목록 Hook 사용
    const { friends, isLoading, refresh, setFriends } = useFriendList(currentUser.id || null);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 200);
    };

    const toggleSelect = (id: number) => {
        const newSet = new Set(selectedFriends);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedFriends(newSet);
    };

    // 검색 필터링
    const filteredFriends = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchText.toLowerCase()) ||
        friend.googleId.toLowerCase().includes(searchText.toLowerCase())
    );

    // ID 복사
    const handleCopyId = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        alert(`ID 복사됨: ${id}`);
    };

    // 전체 삭제 (DB 연동)
    const handleDeleteAll = async () => {
        if (friends.length === 0) return;
        if (!currentUser.id) return;

        if (confirm("모든 친구를 삭제하시겠습니까?")) {
            try {
                const { error } = await supabase
                    .from('friends')
                    .delete()
                    .eq('user_id', currentUser.id);

                if (error) throw error;

                setFriends([]);
                setSelectedFriends(new Set());
                setShowMenu(false);
            } catch (e) {
                console.error("전체 삭제 실패:", e);
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    // 선택 삭제 (DB 연동)
    const handleDeleteSelected = async () => {
        if (selectedFriends.size === 0) return;
        if (!currentUser.id) return;

        if (confirm(`${selectedFriends.size}명의 친구를 삭제하시겠습니까?`)) {
            try {
                const idsToDelete = Array.from(selectedFriends);
                const { error } = await supabase
                    .from('friends')
                    .delete()
                    .in('id', idsToDelete); // relation id로 삭제

                if (error) throw error;

                setFriends(prev => prev.filter(f => !selectedFriends.has(f.id)));
                setSelectedFriends(new Set());
            } catch (e) {
                console.error("선택 삭제 실패:", e);
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    // 유저 검색 핸들러 (보안을 위해 RPC 사용)
    const handleSearchUser = async () => {
        if (!addSearchEmail.trim()) return;
        setIsSearching(true);
        setSearchResult(null);
        try {
            // 보안을 위해 정의된 RPC 함수 호출
            const { data, error } = await supabase.rpc('get_user_by_email', {
                email_input: addSearchEmail.trim()
            });

            if (error) throw error;

            // RPC는 배열을 반환하므로 첫 번째 요소 확인
            if (data && data.length > 0) {
                const user = data[0];
                // 본인인지 확인
                if (user.id === currentUser.id) {
                    alert("본인은 추가할 수 없습니다.");
                    return;
                }

                setSearchResult(user as SearchUserResult);
            } else {
                alert("사용자를 찾을 수 없습니다.");
            }
        } catch (e) {
            console.error("검색 실패:", e);
            alert("검색 중 오류가 발생했습니다. DB에 함수가 설치되어 있는지 확인해주세요.");
        } finally {
            setIsSearching(false);
        }
    };

    // 친구 추가 핸들러
    const handleAddFriend = async () => {
        if (!searchResult || !currentUser.id) return;

        // 이미 친구인지 재확인
        if (friends.some(f => f.friendUserId === searchResult.id)) {
            alert("이미 저장된 계정입니다.");
            return;
        }

        setIsAdding(true);
        try {
            const { error } = await supabase
                .from('friends')
                .insert({
                    user_id: currentUser.id,
                    friend_id: searchResult.id,
                    status: 'added',
                    added_at: new Date().toISOString()
                });

            if (error) throw error;

            alert("친구가 추가되었습니다.");
            closeAddModal(); // 모달 닫기 및 상태 초기화
            refresh(); // 목록 새로고침
        } catch (e) {
            console.error("친구 추가 실패:", e);
            alert("친구 추가에 실패했습니다.");
        } finally {
            setIsAdding(false);
        }
    };

    // 친구 추가 모달 닫기 (상태 초기화)
    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setAddSearchEmail("");
        setSearchResult(null);
    };

    return (
        <div className={`absolute inset-0 z-50 bg-white flex flex-col ${isClosing ? "animate-slide-out" : "animate-slide-in"}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={handleClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-800" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">친구 목록</h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                    >
                        <UserPlus size={16} />
                        <span>친구 추가</span>
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                        >
                            <MoreVertical size={20} />
                        </button>

                        {/* 메뉴 드롭다운 */}
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white border rounded-lg shadow-lg z-20 overflow-hidden">
                                    <button
                                        onClick={handleDeleteAll}
                                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> 전체 삭제
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white pb-16">
                {/* Search Bar */}
                <div className="p-4 pb-2">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2.5 bg-gray-100 border-transparent rounded-lg text-sm placeholder-gray-500 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors outline-none"
                            placeholder="이름 또는 ID 검색..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>

                {/* My Profile */}
                <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-yellow-100 overflow-hidden border border-gray-200">
                                {currentUser.avatarUrl ? (
                                    <img src={currentUser.avatarUrl} alt="me" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle2 className="w-full h-full text-gray-400" />
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-base">{currentUser.name}</span>
                            <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-medium">나</span>
                        </div>
                    </div>
                </div>

                {/* List Header */}
                <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-b border-gray-50">
                    <span>목록 ({filteredFriends.length})</span>
                </div>

                {/* Friend List */}
                <div className="divide-y divide-gray-50">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            로딩 중...
                        </div>
                    ) : (
                        <>
                            {filteredFriends.map((friend) => (
                                <div key={friend.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => toggleSelect(friend.id)}>
                                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                                                {friend.avatarUrl ? (
                                                    <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserCircle2 className="w-full h-full text-gray-400" />
                                                )}
                                            </div>
                                            {friend.isOnline && (
                                                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium text-gray-800 truncate">{friend.name}</span>
                                                {/* ID 복사 버튼 */}
                                                <button
                                                    onClick={(e) => handleCopyId(e, friend.googleId)}
                                                    className="text-gray-400 hover:text-blue-500 p-0.5 rounded transition-colors"
                                                    title="ID 복사"
                                                >
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                            <span className="text-xs text-gray-400 truncate">{friend.googleId}</span>
                                        </div>
                                    </div>

                                    {/* Checkbox */}
                                    <div className="p-1 flex-shrink-0">
                                        {selectedFriends.has(friend.id) ? (
                                            <div className="w-5 h-5 bg-orange-500 rounded border border-orange-500 flex items-center justify-center text-white transition-colors">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 bg-white rounded border border-gray-300 hover:border-orange-400 transition-colors" />
                                        )}
                                    </div>
                                </div>
                            ))}
                            {!isLoading && filteredFriends.length === 0 && (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    {searchText ? "검색 결과가 없습니다." : "친구가 없습니다."}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Footer or Selection Bar */}
            {selectedFriends.size > 0 ? (
                // 선택 삭제
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-between animate-in slide-in-from-bottom-5 duration-200 z-20">
                    <button
                        onClick={() => setSelectedFriends(new Set())}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium flex items-center gap-1"
                    >
                        <X size={16} /> 취소
                    </button>
                    <button
                        onClick={handleDeleteSelected}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        <span>선택 삭제 ({selectedFriends.size})</span>
                    </button>
                </div>
            ) : (
                // Footer
                <div className="p-3 bg-gray-50 border-t flex justify-end gap-3 text-xs text-gray-500" />
            )}

            {/* 친구 추가 모달 */}
            {isAddModalOpen && (
                <>
                    <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeAddModal} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-xl shadow-2xl z-40 p-5 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">친구 추가</h3>
                            <button onClick={closeAddModal} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="email"
                                className="flex-1 px-3 py-2 bg-gray-100 border-transparent rounded-lg text-sm placeholder-gray-500 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors outline-none"
                                placeholder="지메일 주소 입력"
                                value={addSearchEmail}
                                onChange={(e) => setAddSearchEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                            />
                            <button
                                onClick={handleSearchUser}
                                disabled={isSearching || !addSearchEmail.trim()}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors whitespace-nowrap"
                            >
                                {isSearching ? "검색" : "검색"}
                            </button>
                        </div>

                        {searchResult && (
                            <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="w-16 h-16 rounded-full bg-white border-2 border-white shadow-sm overflow-hidden">
                                    {searchResult.avatar_url ? (
                                        <img src={searchResult.avatar_url} alt="result" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle2 className="w-full h-full text-gray-400" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-gray-900 text-lg">{searchResult.nickname}</p>
                                    <p className="text-sm text-gray-500">{(searchResult as any).email}</p>
                                </div>
                                <button
                                    onClick={handleAddFriend}
                                    disabled={isAdding}
                                    className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-1 mt-1"
                                >
                                    {isAdding ? "추가 중..." : <><UserPlus size={16} /> 친구 추가</>}
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
