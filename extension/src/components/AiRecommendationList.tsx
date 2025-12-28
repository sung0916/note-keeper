import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { AiRecommendationItem } from "../types";
import { Bookmark, CheckCircle, ExternalLink, Globe, RefreshCw, X } from "lucide-react";

interface AiRecommendationListProps {
    noteId: number;
    recommendations: AiRecommendationItem[];
    loading: boolean;
    onClose: () => void;
    onRefresh: () => void;
    bottomPosition?: string;
}

export default function AiRecommendationList({
    noteId, recommendations, loading, onClose, onRefresh, bottomPosition = "bottom-40"
}: AiRecommendationListProps) {
    const [savedUrls, setSavedUrls] = useState<string[]>([]);

    // 저장된 북마크 확인
    useEffect(() => {
        const checkExistingBookmarks = async () => {
            const { data } = await supabase
                .from('bookmarks')
                .select('url')
                .eq('note_id', noteId);

            if (data) {
                // 저장된 URL들만 상태에 저장
                setSavedUrls(data.map(item => item.url));
            }
        };
        checkExistingBookmarks();
    }, [noteId]);

    // 북마크 토글 
    const handleToggleBookmark = async (item: AiRecommendationItem) => {
        const isSaved = savedUrls.includes(item.url);

        try {
            if (isSaved) {
                const { error } = await supabase
                    .from('bookmarks')
                    .delete()
                    .eq('note_id', noteId)
                    .eq('url', item.url); // URL 기준으로 삭제

                if (error) throw error;

                setSavedUrls(prev => prev.filter(url => url !== item.url));

            } else {
                const { error } = await supabase.from('bookmarks').insert({
                    note_id: noteId,
                    title: item.title,
                    url: item.url,
                    summary: item.description,
                    source: `AI (${item.category})`
                });

                if (error) throw error;
                setSavedUrls(prev => [...prev, item.url]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const safeList = recommendations || [];

    return (
        <div
            className={`absolute right-6 w-80 bg-[#1e293b] text-white rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-bottom-4 duration-300`}
            style={{ bottom: bottomPosition }}
        >

            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#0f172a]">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">AI RECOMMENDATIONS</span>
                    <span className="bg-blue-600 text-[10px] px-1.5 py-0.5 rounded-full text-white">
                        {safeList.length}
                    </span>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className={`p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white ${loading ? 'animate-spin' : ''}`}
                        title="다시 추천 받기"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white"
                        title="닫기"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* 리스트 영역 */}
            <div className="flex-1 overflow-y-auto max-h-[400px] p-2 space-y-2 custom-scrollbar">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/5 animate-pulse">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-3/4 bg-white/10 rounded" />
                                <div className="h-2 w-full bg-white/10 rounded" />
                            </div>
                        </div>
                    ))
                ) : (
                    safeList.map((item, idx) => {
                        const isSaved = savedUrls.includes(item.url);

                        return (
                            <div key={idx} className="flex gap-3 p-3 rounded-xl bg-[#0f172a]/50 hover:bg-[#0f172a] border border-transparent hover:border-gray-600 transition-all group">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-600">
                                    <Globe size={20} className="text-blue-400" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-gray-100 truncate mb-1" title={item.title}>
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">
                                        {item.description}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">
                                            {item.category}
                                        </span>
                                        <a href={item.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5">
                                            Visit <ExternalLink size={8} />
                                        </a>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center">
                                    <button
                                        onClick={() => handleToggleBookmark(item)} // ✅ 토글 함수로 변경
                                        className={`p-2 rounded-lg transition-colors ${isSaved
                                            ? "text-green-500 bg-green-500/10 hover:bg-red-500/10 hover:text-red-500" // 저장됨 상태에서 호버 시 빨간색 힌트
                                            : "text-gray-500 hover:text-white hover:bg-white/10"
                                            }`}
                                        title={isSaved ? "북마크 취소" : "북마크 저장"}
                                    >
                                        {isSaved ? <CheckCircle size={18} /> : <Bookmark size={18} />}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}

                {!loading && safeList.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-xs">
                        추천 자료가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
}
