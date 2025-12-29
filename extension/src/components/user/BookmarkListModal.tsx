import { useEffect, useMemo, useState } from "react";
import type { Note } from "../../types";
import { supabase } from "../../supabase";
import { ArrowLeft, Bookmark, Check, CheckSquare, ChevronDown, ExternalLink, FileText, MoreVertical, Search, Trash2, X } from "lucide-react";
import NoteDetailModal from "../memo/NoteDetailModal";
import NoteModal from "../memo/NoteModal";

// DB의 bookmarks 테이블 타입 정의 (Join된 notes 포함)
interface BookmarkEntity {
    bookmark_id: number;
    note_id: number;
    title: string;
    url: string;
    description?: string; // or summary
    created_at: string;
    notes: Note; // Join된 노트 정보
}

interface BookmarkListModalProps {
    userId: string;
    onClose: () => void;
}

interface GroupedBookmarks {
    [noteId: number]: {
        note: Note;
        bookmarks: BookmarkEntity[];
    };
}

export default function BookmarkListModal({ userId, onClose }: BookmarkListModalProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [allBookmarks, setAllBookmarks] = useState<BookmarkEntity[]>([]);
    
    // UI States
    const [searchText, setSearchText] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false); 
    const [selectedBookmarks, setSelectedBookmarks] = useState<Set<number>>(new Set());
    const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
    
    // Modals
    const [selectedDetailNote, setSelectedDetailNote] = useState<Note | null>(null);
    const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);

    // 1. 데이터 불러오기 (Bookmarks + Notes Join)
    const fetchBookmarks = async () => {
        setIsLoading(true);
        try {
            // !inner를 사용하여 해당 유저가 작성한 노트의 북마크만 가져옴
            const { data, error } = await supabase
                .from('bookmarks')
                .select(`
                    *,
                    notes!inner (
                        *,
                        users (nickname, avatar_url, email)
                    )
                `)
                .eq('notes.writer_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAllBookmarks(data as any || []);
        } catch (e) {
            console.error("북마크 불러오기 실패:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookmarks();
    }, [userId]);

    // 2. 검색 및 그룹화 로직 (메모별 그룹화)
    const groupedBookmarks = useMemo(() => {
        // 검색어 필터링 (메모 제목, 페이지 제목, 북마크 제목)
        const filtered = allBookmarks.filter(b => {
            const searchLower = searchText.toLowerCase();
            const noteTitle = b.notes.title?.toLowerCase() || "";
            const pageTitle = (b.notes as any).page_title?.toLowerCase() || "";
            const bookmarkTitle = b.title?.toLowerCase() || "";

            return noteTitle.includes(searchLower) || 
                   pageTitle.includes(searchLower) || 
                   bookmarkTitle.includes(searchLower);
        });

        // note_id 기준으로 그룹화
        return filtered.reduce<GroupedBookmarks>((acc, bm) => {
            const noteId = bm.note_id;
            if (!acc[noteId]) {
                acc[noteId] = {
                    note: bm.notes,
                    bookmarks: []
                };
            }
            acc[noteId].bookmarks.push(bm);
            return acc;
        }, {});
    }, [allBookmarks, searchText]);

    const groupKeys = Object.keys(groupedBookmarks).map(Number); // note_id list

    // 검색어가 있으면 모든 그룹 펼치기
    useEffect(() => {
        if (searchText) {
            setExpandedNotes(new Set(groupKeys));
        }
    }, [searchText, allBookmarks]);

    // --- 핸들러 ---

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 200);
    };

    const toggleGroupExpand = (noteId: number) => {
        const newSet = new Set(expandedNotes);
        if (newSet.has(noteId)) newSet.delete(noteId);
        else newSet.add(noteId);
        setExpandedNotes(newSet);
    };

    // 북마크 개별 선택 토글
    const toggleSelectBookmark = (e: React.MouseEvent, bookmarkId: number) => {
        e.stopPropagation();
        const newSet = new Set(selectedBookmarks);
        if (newSet.has(bookmarkId)) newSet.delete(bookmarkId);
        else newSet.add(bookmarkId);
        setSelectedBookmarks(newSet);
    };

    // 북마크 링크 열기
    const handleBookmarkClick = (url: string) => {
        if (isSelectionMode) return;
        window.open(url, '_blank');
    };

    // 메모 상세 보기 (제목 클릭 시)
    const handleNoteTitleClick = (e: React.MouseEvent, note: Note) => {
        e.stopPropagation();
        setSelectedDetailNote(note);
    };

    // 선택 모드 진입/해제
    const enterSelectionMode = () => {
        setIsSelectionMode(true);
        setShowMenu(false);
        // 선택 모드 진입 시 모든 그룹을 펼쳐서 선택하기 쉽게 함
        setExpandedNotes(new Set(groupKeys));
    };

    const exitSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedBookmarks(new Set());
    };

    // 전체 삭제
    const handleDeleteAll = async () => {
        if (allBookmarks.length === 0) return;
        if (!confirm("모든 북마크를 삭제하시겠습니까?\n(메모는 삭제되지 않습니다)")) return;

        try {
            // 현재 리스트에 있는 모든 북마크 ID 추출
            const idsToDelete = allBookmarks.map(b => b.bookmark_id);
            const { error } = await supabase.from('bookmarks').delete().in('bookmark_id', idsToDelete);
            
            if (error) throw error;
            setAllBookmarks([]);
            setShowMenu(false);
        } catch (e) { console.error(e); alert("삭제 실패"); }
    };

    // 선택 삭제
    const handleDeleteSelected = async () => {
        if (selectedBookmarks.size === 0) return;
        if (!confirm(`선택한 ${selectedBookmarks.size}개의 북마크를 삭제하시겠습니까?`)) return;

        try {
            const ids = Array.from(selectedBookmarks);
            const { error } = await supabase.from('bookmarks').delete().in('bookmark_id', ids);
            if (error) throw error;
            
            setAllBookmarks(prev => prev.filter(b => !selectedBookmarks.has(b.bookmark_id)));
            exitSelectionMode();
        } catch (e) { console.error(e); alert("삭제 실패"); }
    };

    return (
        <div className={`absolute inset-0 z-50 bg-white flex flex-col ${isClosing ? "animate-slide-out" : "animate-slide-in"}`}>
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={handleClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-800" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">북마크 목록</h1>
                </div>

                {!isSelectionMode && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                        >
                            <MoreVertical size={20} />
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white border rounded-lg shadow-lg z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        onClick={enterSelectionMode}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <CheckSquare size={16} /> 선택 삭제
                                    </button>
                                    <button
                                        onClick={handleDeleteAll}
                                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t"
                                    >
                                        <Trash2 size={16} /> 전체 삭제
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white pb-20">
                {/* Search Bar */}
                <div className="p-4 pb-2">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2.5 bg-gray-100 border-transparent rounded-lg text-sm placeholder-gray-500 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors outline-none"
                            placeholder="메모 제목, 북마크 제목 검색..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>

                {/* List Header */}
                <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-b border-gray-50">
                    <span>저장된 북마크 ({allBookmarks.length})</span>
                    {isSelectionMode && <span className="text-orange-600 font-bold">삭제할 항목 선택 중</span>}
                </div>

                {/* Grouped Lists (By Note) */}
                <div className="divide-y divide-gray-100">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">로딩 중...</div>
                    ) : groupKeys.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            {searchText ? "검색 결과가 없습니다." : "저장된 북마크가 없습니다."}
                        </div>
                    ) : (
                        groupKeys.map((noteId) => {
                            const group = groupedBookmarks[noteId];
                            const isExpanded = expandedNotes.has(noteId);

                            return (
                                <div key={noteId} className="bg-white">
                                    {/* Note Group Header */}
                                    <div 
                                        className="px-4 py-3 bg-gray-50 border-y border-gray-100 flex items-center justify-between transition-colors"
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <FileText size={16} className="text-indigo-500 flex-shrink-0" />
                                            {/* 메모 제목 (클릭 시 상세 모달) */}
                                            <button 
                                                onClick={(e) => handleNoteTitleClick(e, group.note)}
                                                className="font-bold text-sm text-gray-800 truncate hover:text-indigo-600 hover:underline text-left"
                                            >
                                                {group.note.title || "제목 없는 메모"}
                                            </button>
                                            <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                                                ({group.bookmarks.length})
                                            </span>
                                        </div>
                                        
                                        {/* 펼치기/접기 버튼 (전체 영역이 아닌 아이콘만 눌러도 되지만, UX상 우측 영역 할당) */}
                                        <button 
                                            onClick={() => toggleGroupExpand(noteId)}
                                            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors ml-2"
                                        >
                                            <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDown size={20} />
                                            </div>
                                        </button>
                                    </div>

                                    {/* Bookmarks List (Accordion Body) */}
                                    <div 
                                        className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
                                            isExpanded ? "max-h-[1000px]" : "max-h-0"
                                        }`}
                                    >
                                        <div className="divide-y divide-gray-50 bg-white pl-4">
                                            {group.bookmarks.map((bm) => (
                                                <div 
                                                    key={bm.bookmark_id} 
                                                    onClick={(e) => isSelectionMode ? toggleSelectBookmark(e, bm.bookmark_id) : handleBookmarkClick(bm.url)}
                                                    className={`pr-4 py-3 flex items-center justify-between gap-3 transition-colors group ${
                                                        isSelectionMode ? "cursor-pointer" : "cursor-pointer hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <Bookmark size={14} className="text-green-500 flex-shrink-0" />
                                                            <span className="text-sm font-medium text-gray-700 truncate">
                                                                {bm.title}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-1 pl-6">
                                                            <ExternalLink size={10} className="text-gray-300" />
                                                            <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                                                                {bm.url}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Checkbox (Only in Selection Mode) */}
                                                    {isSelectionMode && (
                                                        <div 
                                                            className="flex-shrink-0 p-1"
                                                            onClick={(e) => toggleSelectBookmark(e, bm.bookmark_id)}
                                                        >
                                                            {selectedBookmarks.has(bm.bookmark_id) ? (
                                                                <div className="w-5 h-5 bg-orange-500 rounded border border-orange-500 flex items-center justify-center text-white animate-in zoom-in-50 duration-200">
                                                                    <Check size={14} strokeWidth={3} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-5 h-5 bg-white rounded border border-gray-300 group-hover:border-orange-400 transition-colors" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Bottom Bar (Selection Mode) */}
            {isSelectionMode && (
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-between animate-in slide-in-from-bottom-5 duration-200 z-20">
                    <button
                        onClick={exitSelectionMode}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium flex items-center gap-1"
                    >
                        <X size={16} /> 취소
                    </button>
                    <button
                        onClick={handleDeleteSelected}
                        disabled={selectedBookmarks.size === 0}
                        className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2 ${
                            selectedBookmarks.size > 0 
                                ? "bg-red-500 hover:bg-red-600 text-white" 
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                        <Trash2 size={16} />
                        <span>삭제 ({selectedBookmarks.size})</span>
                    </button>
                </div>
            )}

            {/* Note Detail Modal (View/Edit Note) */}
            {selectedDetailNote && (
                <div className="absolute inset-0 z-[60]">
                    <NoteDetailModal
                        note={selectedDetailNote}
                        autoTriggerAi={false}
                        onClose={() => setSelectedDetailNote(null)}
                        onEdit={(note) => {
                            setSelectedDetailNote(null);
                            setNoteToEdit(note);
                        }}
                    />
                </div>
            )}

             {/* Note Edit Modal */}
             {noteToEdit && (
                <NoteModal
                    pageUrl={noteToEdit.page_url}
                    pageTitle={(noteToEdit as any).page_title || "메모 수정"}
                    noteToEdit={noteToEdit}
                    onClose={() => setNoteToEdit(null)}
                    onNoteSaved={() => {
                        setNoteToEdit(null);
                        fetchBookmarks(); // 내용이 바뀌었을 수 있으므로 새로고침
                    }}
                />
            )}
        </div>
    );
}
