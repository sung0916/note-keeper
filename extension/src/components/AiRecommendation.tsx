import { useState } from "react";
import { supabase } from "../supabase";

interface AiRecommendationProps {
    noteId: number;
    pageUrl: string;
    selectedText: string;
}

interface AiResultData {
    summary: string;
    source: string;
    keywords: string[];
}

export default function AiRecommendation({ noteId, pageUrl, selectedText }:
    AiRecommendationProps) {

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AiResultData | null>(null);

    // AI 추천 요청 함수
    const handleAskAi = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('http://localhost:3000/api/ai/recommend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ text: selectedText, url: pageUrl }),
            });

            const data = await response.json();
            if (data.success) {
                const { summary, keywords, category } = data.data;

                setResult({
                    summary: summary,
                    source: `AI (${category})`,
                    keywords: keywords
                });
            } else {
                // 백엔드에서 에러 메시지를 보낸 경우
                alert(data.error || "AI 분석에 실패했습니다.");
            }
        } catch (e) {
            console.error(e);
            alert('AI 요청 실패');

        } finally {
            setLoading(false);
        }
    };

    // 북마크 추가
    const handleSaveBookmark = async () => {
        if (!result || !noteId) return;

        try {
            const { error } = await supabase.from('bookmarks').insert({
                note_id: noteId,
                title: "AI 추천 정보",
                url: pageUrl,
                summary: result.summary,
                source: result.source
            });

            if (error) throw error;
            setResult(null);  // 저장 후 초기화

        } catch (e) {
            console.error(e);
            alert('저장 실패');
        }
    };

    return (
        <div className="p-4 border rounded bg-gray-50">
            {!result ? (
                <button
                    onClick={handleAskAi}
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    {loading ? 'AI 분석 중...' : 'AI 추천 받기'}
                </button>
            ) : (
                <div className="space-y-3">
                    <div className="p-3 bg-white border rounded shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-sm text-gray-800">✨ AI 요약 결과</h4>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                {result.source}
                            </span>
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {result.summary}
                        </p>

                        {/* 키워드 태그 보여주기 (추가됨) */}
                        {result.keywords && result.keywords.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                                {result.keywords.map((keyword, idx) => (
                                    <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border">
                                        #{keyword}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveBookmark}
                            className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700"
                        >
                            북마크로 저장
                        </button>
                        <button
                            onClick={() => setResult(null)}
                            className="px-3 py-2 text-gray-500 text-sm hover:bg-gray-200 rounded"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
