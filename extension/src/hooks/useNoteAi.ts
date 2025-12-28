import { useState } from "react";
import { type AiRecommendationItem } from "../types";
import { analyzeNoteWithAI } from "../api/ai";

export function useNoteAi(pageUrl: string) {
    const [showAiDropdown, setShowAiDropdown] = useState(false);
    const [recommendations, setRecommendations] = useState<AiRecommendationItem[]>([]);
    const [lastRequest, setLastRequest] = useState<{ text: string, context: 'note' | 'comment' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const requestAi = async (text: string, context: 'note' | 'comment') => {
        if (isLoading) return;
        setIsLoading(true);
        setShowAiDropdown(true);
        setLastRequest({ text, context });

        try {
            const data = await analyzeNoteWithAI(text, pageUrl, context);
            if (data && Array.isArray(data.recommendations)) {
                setRecommendations(data.recommendations);
            } else { setRecommendations([]); }
        } catch (error) { console.error(error); setShowAiDropdown(false); }
        finally { setIsLoading(false); }
    };

    const refreshAi = () => {
        if (lastRequest) requestAi(lastRequest.text, lastRequest.context);
    };

    return {
        showAiDropdown,
        setShowAiDropdown,
        recommendations,
        isLoading,
        requestAi,
        refreshAi
    };
};
