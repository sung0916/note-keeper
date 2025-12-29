import { supabase } from "../supabase";

export async function getAiRecommendation(text: string, pageUrl: string) {
    const { data: { session } } = await supabase.auth.getSession(); 
    if (!session) { throw new Error("로그인이 필요합니다."); }

    const response = await fetch('http://localhost:3000/api/ai/recommend', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text, url: pageUrl }),
    });
    if (!response.ok) { throw new Error("API 요청 실패"); }

    return await response.json();
}
