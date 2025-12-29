import { supabase } from "../supabase";
import type { AiAnalysisResult } from "../types";

const API_BASE_URL = "https://note-keeper-nu.vercel.app";

export async function analyzeNoteWithAI(text: string, url: string, contextType: 'note' | 'comment'): Promise<AiAnalysisResult> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { throw new Error('로그인 필요'); }
    
    const response = await fetch(`${API_BASE_URL}/api/ai/recommend`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text, url, contextType }),
    });
    
    const json = await response.json();
    if (!response.ok) { throw new Error(json.error || "AI 분석 실패"); }

    return json.data;
}
