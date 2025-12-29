import { useEffect, useMemo, useState } from "react";
import type { Note } from "../../types";
import { supabase } from "../../supabase";
import { ArrowLeft, Check, CheckSquare, ChevronDown, Copy, FileText, Folder, MoreVertical, Search, Trash2, X } from "lucide-react";
import NoteDetailModal from "../memo/NoteDetailModal";
import NoteModal from "../memo/NoteModal";

interface MemoListModalProps {
    userId: string;
    currentUrl?: string;
    currentPageTitle?: string;
    onClose: () => void;
}

interface GroupedNotes {
    [pageUrl: string]: {
        pageTitle: string;
        notes: Note[];
    };
}

export default function MemoListModal({ userId, currentUrl, currentPageTitle, onClose }: MemoListModalProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [notes, setNotes] = useState<Note[]>([]);
    
    // UI States
    const [searchText, setSearchText] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false); 
    const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [selectedDetailNote, setSelectedDetailNote] = useState<Note | null>(null);
    const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);

    // 1. 데이터 불러오기 (Join 쿼리 수정)
    const fetchNotes = async () => {
        setIsLoading(true);
        try {
            // users 테이블 정보를 함께 가져오도록
            const { data, error } = await supabase
                .from('notes')
                .select('*, users(nickname, avatar_url, email)') 
                .eq('writer_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            // 타입 캐스팅
            setNotes(data as any || []);
        } catch (e) {
            console.error("메모 불러오기 실패:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [userId]);

    // 2. 그룹화 및 검색 로직
    const groupedNotes = useMemo(() => {
        const filtered = notes.filter(n =>
            (n.title && n.title.toLowerCase().includes(searchText.toLowerCase())) || 
            n.content.toLowerCase().includes(searchText.toLowerCase())
        );

        return filtered.reduce<GroupedNotes>((acc, note) => {
            const url = note.page_url;
            
            if (!acc[url]) {
                let displayTitle = url; 

                if (currentUrl && url === currentUrl && currentPageTitle) {
                    displayTitle = currentPageTitle;
                } 
                else if ((note as any).page_title) {
                    displayTitle = (note as any).page_title;
                }

                acc[url] = {
                    pageTitle: displayTitle,
                    notes: []
                };
            }
            acc[url].notes.push(note);
            return acc;
        }, {});
    }, [notes, searchText, currentUrl, currentPageTitle]);

    const groupKeys = Object.keys(groupedNotes);

    useEffect(() => {
        if (searchText) {
            setExpandedGroups(new Set(groupKeys));
        } else if (currentUrl && groupKeys.includes(currentUrl)) {
            setExpandedGroups(new Set([currentUrl]));
        }
    }, [searchText, currentUrl, notes]);

    // --- 핸들러들 ---
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 200);
    };

    const toggleSelect = (e: React.MouseEvent, noteId: number) => {
        e.stopPropagation();
        const newSet = new Set(selectedNotes);
        if (newSet.has(noteId)) newSet.delete(noteId);
        else newSet.add(noteId);
        setSelectedNotes(newSet);
    };

    const toggleGroupExpand = (url: string) => {
        const newSet = new Set(expandedGroups);
        if (newSet.has(url)) newSet.delete(url);
        else newSet.add(url);
        setExpandedGroups(newSet);
    };

    const enterSelectionMode = () => {
        setIsSelectionMode(true);
        setShowMenu(false);
    };

    const exitSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedNotes(new Set());
    };

    const handleCopyUrl = (e: React.MouseEvent, url: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(url);
        alert("URL이 복사되었습니다.");
    };

    const handleDeleteAll = async () => {
        if (notes.length === 0) return;
        if (!confirm("정말 모든 메모를 삭제하시겠습니까?")) return;
        try {
            const { error } = await supabase.from('notes').delete().eq('writer_id', userId);
            if (error) throw error;
            setNotes([]);
            setShowMenu(false);
        } catch (e) { console.error(e); alert("삭제 실패"); }
    };

    const handleDeleteSelected = async () => {
        if (selectedNotes.size === 0) return;
        if (!confirm(`선택한 ${selectedNotes.size}개의 메모를 삭제하시겠습니까?`)) return;
        try {
            const ids = Array.from(selectedNotes);
            const { error } = await supabase.from('notes').delete().in('note_id', ids);
            if (error) throw error;
            setNotes(prev => prev.filter(n => !selectedNotes.has(n.note_id)));
            exitSelectionMode();
        } catch (e) { console.error(e); alert("삭제 실패"); }
    };

    const handleNoteClick = (note: Note) => {
        if (isSelectionMode) return;
        setSelectedDetailNote(note);
    };

    // 수정 요청
    const handleEditRequest = (note: Note) => {
        setSelectedDetailNote(null); 
        setNoteToEdit(note);       
    };

    return (
        <div className={`absolute inset-0 z-50 bg-white flex flex-col ${isClosing ? "animate-slide-out" : "animate-slide-in"}`}>
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button onClick={handleClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-800" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">메모 목록</h1>
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
                            placeholder="메모 검색..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                </div>

                {/* List Header */}
                <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-b border-gray-50">
                    <span>전체 페이지 ({groupKeys.length})</span>
                    {isSelectionMode && <span className="text-orange-600 font-bold">삭제할 메모 선택 중</span>}
                </div>

                {/* Grouped Lists */}
                <div className="divide-y divide-gray-100">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">로딩 중...</div>
                    ) : groupKeys.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            {searchText ? "검색 결과가 없습니다." : "저장된 메모가 없습니다."}
                        </div>
                    ) : (
                        groupKeys.map((pageUrl) => {
                            const group = groupedNotes[pageUrl];
                            const isExpanded = expandedGroups.has(pageUrl);
                            const isCurrentPage = currentUrl && pageUrl === currentUrl;

                            return (
                                <div key={pageUrl} className="bg-white">
                                    <div 
                                        onClick={() => toggleGroupExpand(pageUrl)}
                                        className={`px-4 py-3 border-y border-gray-100 flex items-center justify-between cursor-pointer transition-colors ${
                                            isCurrentPage ? "bg-blue-50/60" : "bg-gray-50 hover:bg-gray-100"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <Folder size={15} className={`${isCurrentPage ? "text-blue-600" : "text-gray-400"} flex-shrink-0`} />
                                            <span className={`font-bold text-sm truncate select-none ${isCurrentPage ? "text-blue-700" : "text-gray-700"}`} title={group.pageTitle}>
                                                {group.pageTitle}
                                            </span>
                                            <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                                                ({group.notes.length})
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={(e) => handleCopyUrl(e, pageUrl)}
                                                className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                                title="페이지 URL 복사"
                                            >
                                                <Copy size={14} />
                                            </button>
                                            <div className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDown size={18} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isExpanded ? "max-h-[1000px]" : "max-h-0"}`}>
                                        <div className="divide-y divide-gray-50 bg-white pl-4">
                                            {group.notes.map((note) => (
                                                <div 
                                                    key={note.note_id} 
                                                    onClick={() => isSelectionMode ? toggleSelect({ stopPropagation: () => {} } as any, note.note_id) : handleNoteClick(note)}
                                                    className={`pr-4 py-3 flex items-center justify-between gap-3 transition-colors group ${
                                                        isSelectionMode ? "cursor-pointer" : "cursor-pointer hover:bg-gray-50"
                                                    }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <FileText size={12} className="text-gray-400 flex-shrink-0" />
                                                            <span className={`text-sm font-medium truncate ${note.title ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                                                                {note.title || "제목 없음"}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 mt-1 pl-6">
                                                            {new Date(note.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>

                                                    {isSelectionMode && (
                                                        <div 
                                                            className="flex-shrink-0 p-1"
                                                            onClick={(e) => toggleSelect(e, note.note_id)}
                                                        >
                                                            {selectedNotes.has(note.note_id) ? (
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

            {/* Bottom Bar */}
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
                        disabled={selectedNotes.size === 0}
                        className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2 ${
                            selectedNotes.size > 0 
                                ? "bg-red-500 hover:bg-red-600 text-white" 
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                        <Trash2 size={16} />
                        <span>삭제 ({selectedNotes.size})</span>
                    </button>
                </div>
            )}

            {/* Note Detail Modal */}
            {selectedDetailNote && (
                <div className="absolute inset-0 z-[60]">
                    <NoteDetailModal
                        note={selectedDetailNote}
                        autoTriggerAi={false}
                        onClose={() => setSelectedDetailNote(null)}
                        onEdit={handleEditRequest} // 수정 핸들러 연결
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
                        fetchNotes(); 
                    }}
                />
            )}
        </div>
    );
}
