import { useState } from "react";
import { type AiAnalysisResult, type Note } from "../types";
import { analyzeNoteWithAI } from "../api/ai";
import { Edit2, Send, Sparkles, UserCircle2, X } from "lucide-react";
import AiResultModal from "./AiResultModal";

interface NoteDetailModalProps {
    note: Note;
    onClose: () => void;
    onEdit: (note: Note) => void;
}

export default function NoteDetailModal({ note, onClose, onEdit }: NoteDetailModalProps) {
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);

    const handleAiClick = async () => {
        if (isAiLoading) return;
        setIsAiLoading(true);

        try {
            const result = await analyzeNoteWithAI(note.content, note.page_url);
            setAiResult(result);
        } 
        catch (err: any) { alert(err.message); }
        finally { setIsAiLoading(false); }
    };

    return (
        <>
            <div className="absolute inset-0 z-40 bg-white flex flex-col animate-in slide-in-from-right duration-300">
                
                {/* 1. 상단 네비게이션 */}
                <div className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                    <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-600" />
                    </button>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => onEdit(note)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        >
                            <Edit2 size={20} />
                        </button>
                    </div>
                </div>

                {/* 2. 메인 컨텐츠 (스크롤 영역) */}
                <div className="flex-1 overflow-y-auto p-5 pb-24 custom-scrollbar">
                    
                    {/* 제목 영역 */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4">
                            {note.title}
                        </h1>
                        
                        {/* 작성자 정보 */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {note.users?.avatar_url ? (
                                    <img src={note.users.avatar_url} alt="profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle2 size={40} className="text-gray-400" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">
                                    {note.users?.nickname || "Unknown User"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {new Date(note.created_at).toLocaleString()} • Author
                                </p>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100 mb-6" />

                    {/* 본문 내용 */}
                    <div 
                        className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap mb-10"
                        style={{ color: note.text_color || 'inherit' }}
                    >
                        {note.content}
                    </div>

                    {/* 댓글 영역 (Placeholder) */}
                    <div className="mt-8">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Comments (0)</h3>
                        <div className="flex gap-3 items-start">
                             <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                             <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    placeholder="Write a comment..." 
                                    className="w-full bg-gray-100 border-0 rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                                    <Send size={14} />
                                </button>
                             </div>
                        </div>
                    </div>
                </div>

                {/* 3. Floating Action Button (AI) */}
                <button
                    onClick={handleAiClick}
                    disabled={isAiLoading}
                    className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-50 group"
                    title="AI 추천 받기"
                >
                    {isAiLoading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                    )}
                </button>
            </div>

            {/* AI 결과 모달 (Floating Button 클릭 시 뜸) */}
            {aiResult && (
                <AiResultModal
                    noteId={note.note_id}
                    data={aiResult}
                    onClose={() => setAiResult(null)}
                />
            )}
        </>
    );
}
