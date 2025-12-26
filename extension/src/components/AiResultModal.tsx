import { useState } from "react";
import type { AiAnalysisResult } from "../types";
import { supabase } from "../supabase";
import { Bookmark, CheckCircle, Sparkles, X } from "lucide-react";

interface AiResultModalProps {
    noteId: number;
    data: AiAnalysisResult;
    onClose: () => void;
}

export default function AiResultModal({ noteId, data, onClose }: AiResultModalProps) {
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = async () => {
        try {
            const { error } = await supabase.from('bookmarks').insert({
                node_id: noteId,
                title: data.title,
                summary: data.summary,
                source: data.source,
                url: data.url,
                created_at: data.created_at,
            });

            if (error) throw error;
            setIsSaved(true);

        } catch (e) {
            console.error(e);
            alert('저장이 실패하였습니다.');
        }
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm bg-[#1a1c23] text-white rounded-2xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col max-h-[80vh]">

                {/* 헤더 */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Sparkles size={18} className="text-blue-400" />
                        AI 분석 결과
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* 컨텐츠 (스크롤 가능) */}
                <div className="p-5 overflow-y-auto space-y-6">

                    {/* 카테고리 뱃지 */}
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                        {data.category}
                    </div>

                    {/* 요약 섹션 */}
                    <div>
                        <h4 className="text-gray-400 text-xs font-bold uppercase mb-2 tracking-wider">Summary</h4>
                        <p className="text-sm leading-relaxed text-gray-200 bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                            {data.summary}
                        </p>
                    </div>

                    {/* 키워드 섹션 */}
                    {data.keywords && data.keywords.length > 0 && (
                        <div>
                            <h4 className="text-gray-400 text-xs font-bold uppercase mb-2 tracking-wider">Keywords</h4>
                            <div className="flex flex-wrap gap-2">
                                {data.keywords.map((kw, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-200 transition-colors cursor-default">
                                        #{kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 하단 버튼 */}
                <div className="p-4 border-t border-gray-700 bg-[#1a1c23]">
                    <button
                        onClick={handleSave}
                        disabled={isSaved}
                        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isSaved
                                ? "bg-green-600 text-white cursor-default"
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                            }`}
                    >
                        {isSaved ? (
                            <>
                                <CheckCircle size={18} />
                                북마크 저장 완료
                            </>
                        ) : (
                            <>
                                <Bookmark size={18} />
                                결과 저장하기
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
