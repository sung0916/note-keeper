import { useState } from "react";
import type { Note } from "../types";
import { BookOpen, ChevronDown, ChevronUp, MessageSquareShare, Sparkles, Trash2 } from "lucide-react";

interface NoteItemProps {
    note: Note;
    onDelete: (id: number) => void;
    onEdit: (note: Note) => void;
    onAiAnalyze: (note: Note) => void;
}

export default function NoteItem({ note, onDelete, onEdit, onAiAnalyze }: NoteItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const formattedDate = new Date(note.created_at).toLocaleDateString('ko-KR', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
    });

    const displayContent = note.content.length > 100
        ? note.content.slice(0, 100) + '...'
        : note.content;

    return (
        <div
            className="rounded-xl shadow-sm border transition-all duration-300 mb-3 overflow-hidden"
            style={{
                backgroundColor: note.bg_color || '#ffffff',
                borderColor: note.bg_color && note.bg_color !== '#ffffff' ? 'transparent' : '#e5e7eb'
            }}
        >
            {/* 1. 상단 헤더 (항상 보임) */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer"
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
                    {/* 날짜 (접혀있을 때만 보임 - 선택사항) */}
                    {!isExpanded && (
                        <span
                            className="text-[10px] mt-1 opacity-60"
                            style={{ color: note.text_color || '#000000' }}
                        >
                            {formattedDate}
                        </span>
                    )}
                </div>

                {/* 펼치기/접기 아이콘 */}
                <button className="p-1 rounded-full hover:bg-black/5 transition-colors">
                    {isExpanded ? (
                        <ChevronUp size={20} style={{ color: note.text_color || '#000000' }} />
                    ) : (
                        <ChevronDown size={20} style={{ color: note.text_color || '#000000' }} />
                    )}
                </button>
            </div>

            {/* 2. 확장 영역 (내용 + 버튼들) */}
            {isExpanded && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">

                    {/* 내용 */}
                    <p
                        className="text-sm leading-relaxed whitespace-pre-wrap mb-4 opacity-90"
                        style={{ color: note.text_color || '#000000' }}
                    >
                        {displayContent}
                    </p>

                    <div
                        className="h-px w-full mb-3 opacity-20"
                        style={{ backgroundColor: note.text_color || '#000000' }}
                    />

                    {/* 하단 액션 버튼들 */}
                    <div className="flex items-center justify-between">

                        {/* 왼쪽: 공유 버튼 */}
                        <button
                            className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                            title="공유하기"
                            style={{ color: note.text_color || '#000000' }}
                        >
                            <MessageSquareShare size={18} />
                        </button>

                        {/* 오른쪽: 열기, AI, 삭제 */}
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('정말 삭제하시겠습니까?')) onDelete(note.note_id);
                                }}
                                className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-600 transition-colors"
                                title="삭제"
                                style={{ color: note.text_color || '#000000' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* 확장 시 하단 날짜 표시 */}
                    <div className="mt-2 text-right">
                        <span className="text-[10px] opacity-50" style={{ color: note.text_color || '#000000' }}>
                            {new Date(note.created_at).toLocaleString()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
