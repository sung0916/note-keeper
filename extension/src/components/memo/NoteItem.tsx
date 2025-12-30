import { useState } from "react";
import type { Note } from "../../types";
import { BookOpen, Check, ChevronDown, Share2, Sparkles, Trash2 } from "lucide-react";

interface NoteItemProps {
    note: Note;
    onDelete: (id: number) => void;
    onEdit: (note: Note) => void;
    onAiAnalyze: (note: Note) => void;
    isSelected: boolean;
    onToggleSelect: () => void;
    isSelectionMode: boolean;
    onShare: (note: Note) => void;
}

export default function NoteItem({ note, onDelete, onEdit, onAiAnalyze, isSelected, onToggleSelect, isSelectionMode, onShare }: NoteItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const formattedDate = new Date(note.created_at).toLocaleDateString('ko-KR', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
    });

    const displayContent = note.content.length > 50
        ? note.content.slice(0, 50) + '...'
        : note.content;

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(note.note_id);
    };

    return (
        <div
            className="rounded-xl shadow-sm border transition-all duration-300 mb-3 overflow-hidden"
            style={{
                backgroundColor: note.bg_color || '#ffffff',
                borderColor: note.bg_color && note.bg_color !== '#ffffff' ? 'transparent' : '#e5e7eb'
            }}
        >


            {/* 상단 헤더 */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer relative"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex flex-col min-w-0 flex-1 mr-2">
                    {/* 제목 */}
                    <h3
                        className="font-bold text-base truncate"
                        style={{ color: note.text_color || '#000000' }}
                    >
                        {note.title || "제목 없음"}
                    </h3>
                    {/* 날짜 */}
                    {!isExpanded && (
                        <span
                            className="text-[10px] mt-1 opacity-60 animate-in fade-in duration-200"
                            style={{ color: note.text_color || '#000000' }}
                        >
                            {formattedDate}
                        </span>
                    )}
                </div>

                {/* 체크박스 및 펼치기 버튼 */}
                <div className="flex flex-col items-end gap-2">

                    {/* 체크박스 */}
                    {isSelectionMode && (
                        <div
                            className="p-1 animate-in fade-in zoom-in-75 duration-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelect();
                            }}
                        >
                            {isSelected ? (
                                <div className="w-5 h-5 bg-orange-500 rounded border border-orange-500 flex items-center justify-center text-white transition-colors">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                            ) : (
                                <div className="w-5 h-5 bg-white rounded border border-gray-300 hover:border-orange-400 transition-colors" />
                            )}
                        </div>
                    )}

                    {/* 펼치기 아이콘 */}
                    <button className="p-1 mt-4 rounded-full hover:bg-black/5 transition-colors">
                        <ChevronDown
                            size={20}
                            style={{ color: note.text_color || '#000000' }}
                            className={`transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180' : ''}`}
                        />
                    </button>
                </div>
            </div>

            {/* 확장 (내용, 버튼) */}
            <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
            >
                {/* 내부 컨텐츠 wrapper */}
                <div className="overflow-hidden min-h-0">
                    <div className="px-4 pb-4">
                        {/* 내용 */}
                        <p
                            className="text-sm leading-relaxed whitespace-pre-wrap mb-4 opacity-90 break-words"
                            style={{ color: note.text_color || '#000000' }}
                        >
                            {displayContent}
                        </p>

                        <div
                            className="h-px w-full mb-3 opacity-20"
                            style={{ backgroundColor: note.text_color || '#000000' }}
                        />

                        <div className="flex items-center justify-between">
                            <button
                                className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                                title="공유하기"
                                style={{ color: note.text_color || '#000000' }}
                                onClick={() => onShare(note)}
                            >
                                <Share2 size={18} />
                            </button>

                            <div className="flex gap-1">
                                <button
                                    onClick={() => onEdit(note)}
                                    className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                                    title="메모 열기/수정"
                                    style={{ color: note.text_color || '#000000' }}
                                >
                                    <BookOpen size={18} />
                                </button>

                                <button
                                    onClick={() => onAiAnalyze(note)}
                                    className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                                    title="AI 추천 받기"
                                    style={{ color: note.text_color || '#000000' }}
                                >
                                    <Sparkles size={18} />
                                </button>

                                <button
                                    onClick={handleDeleteClick}
                                    className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-600 transition-colors"
                                    title="삭제"
                                    style={{ color: note.text_color || '#000000' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-2 text-right">
                            <span className="text-[10px] opacity-50" style={{ color: note.text_color || '#000000' }}>
                                {new Date(note.created_at).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
