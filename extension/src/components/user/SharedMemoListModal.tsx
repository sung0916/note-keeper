import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, FileText, Search } from "lucide-react";
import { supabase } from "../../supabase";
import type { Note } from "../../types";
import NoteDetailModal from "../memo/NoteDetailModal";

interface SharedMemoListModalProps {
    currentUserId: string;
    targetUserId: string;
    onClose: () => void;
}

export default function SharedMemoListModal({ currentUserId, targetUserId, onClose }: SharedMemoListModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [notes, setNotes] = useState<Note[]>([]);
    const [isClosing, setIsClosing] = useState(false);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [searchText, setSearchText] = useState("");

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 200);
    };

    const fetchSharedNotes = async () => {
        setIsLoading(true);
        try {
            // 1. 내가 공유한 메모 (내가 주인, 상대가 게스트)
            const { data: myShared, error: myError } = await supabase
                .from('note_shares')
                .select('note_id')
                .eq('guest_id', targetUserId)
                .eq('status', 'ACCEPTED');

            if (myError) throw myError;

            // 2. 상대가 공유한 메모 (상대가 주인, 내가 게스트)
            const { data: theirShared, error: theirError } = await supabase
                .from('note_shares')
                .select('note_id')
                .eq('guest_id', currentUserId)
                .eq('status', 'ACCEPTED');

            if (theirError) throw theirError;

            // 노트 ID 수집 (중복 제거 필요 시 Set 사용)
            const noteIds = new Set([
                ...(myShared?.map(r => r.note_id) || []),
                ...(theirShared?.map(r => r.note_id) || [])
            ]);

            if (noteIds.size === 0) {
                setNotes([]);
                return;
            }

            // 노트 정보 가져오기 (작성자 필터링 추가: 두 사람 중 한 명이 작성한 것만)
            const { data: notesData, error: notesError } = await supabase
                .from('notes')
                .select('*, users:writer_id(nickname, avatar_url)')
                .in('note_id', Array.from(noteIds))
                .order('created_at', { ascending: false });

            if (notesError) throw notesError;

            // 혹시 모르니 작성자 필터링 (share 테이블 로직상 이미 걸러지지만 이중 확인)
            const filteredNotes = notesData?.filter(n => n.writer_id === currentUserId || n.writer_id === targetUserId) || [];

            setNotes(filteredNotes as any[]);
        } catch (error) {
            console.error("공유 메모 로딩 실패:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSharedNotes();
    }, [currentUserId, targetUserId]);

    const filteredNotes = notes.filter(note =>
        note.title?.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div className={`absolute inset-0 z-50 bg-white flex flex-col ${isClosing ? "animate-slide-out" : "animate-slide-in"}`}>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b bg-white sticky top-0 z-10">
                <button onClick={handleClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-800" />
                </button>
                <div>
                    <h1 className="text-lg font-bold text-gray-900">공유 중인 메모</h1>
                    <p className="text-xs text-gray-500">두 사람 간에 공유된 메모 목록</p>
                </div>
            </div>

            {/* Search */}
            <div className="p-4 pb-2 bg-white">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-100 border-transparent rounded-lg text-sm placeholder-gray-500 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors outline-none"
                        placeholder="제목 검색..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-2">
                {isLoading ? (
                    <div className="text-center py-10 text-gray-400 text-sm">로딩 중...</div>
                ) : filteredNotes.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        {searchText ? "검색 결과가 없습니다." : "공유된 메모가 없습니다."}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredNotes.map(note => (
                            <div
                                key={note.note_id}
                                onClick={() => setSelectedNote(note)}
                                className="p-3 bg-white border rounded-xl hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FileText size={16} className="text-blue-500 flex-shrink-0" />
                                        <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                            {note.title || "제목 없음"}
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400 pl-6">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                    <span>
                                        {note.writer_id === currentUserId ? "내가 작성함" : (note.users?.nickname || "상대방이 작성함")}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedNote && (
                <div className="absolute inset-0 z-[60]">
                    <NoteDetailModal
                        note={selectedNote}
                        autoTriggerAi={false}
                        onClose={() => setSelectedNote(null)}
                        onEdit={() => { }} // 읽기 전용으로 보거나 여기서 수정 로직 추가 가능
                    />
                </div>
            )}
        </div>
    );
}
