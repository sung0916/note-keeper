import { supabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

// 네이버 검색 API 결과 타입 정의
interface NaverItem {
    title: string;
    link: string;
    description: string;
    postdate?: string;
    pubDate?: string;
}

export async function POST(request: Request) {

    try {
        // 1. 인증 확인 (기존과 동일)
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "토큰 없음" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return NextResponse.json({ error: "유효하지 않은 사용자" }, { status: 401 });

        // 네이버 API 키 확인
        const clientId = process.env.NAVER_CLIENT_ID;
        const clientSecret = process.env.NAVER_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            return NextResponse.json({ error: "네이버 API 설정 누락" }, { status: 500 });
        }

        const { text } = await request.json();
        const truncatedText = text && text.length > 1000 ? text.slice(0, 1000) + "..." : (text || "");

        // 2. [AI 단계] Groq에게 "검색 키워드" 추출 요청
        const completion = await openai.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: `
                        You are a search query generator for a Korean user.
                        
                        TASK:
                        1. Analyze the given text (which might be in English or Korean).
                        2. Identify the core topic.
                        3. If the text is English, **TRANSLATE** the core topic into a natural **Korean** search keyword.
                        4. Return ONLY the Korean keyword. No explanations.
                        
                        EXAMPLES:
                        - Input: "How to use React useEffect" -> Output: "React useEffect 사용법"
                        - Input: "The future of AI Search" -> Output: "AI 검색의 미래"
                        - Input: "Pasta recipe" -> Output: "파스타 레시피"
                    `
                },
                { role: "user", content: truncatedText },
            ],
            temperature: 0.1,
        });

        const keyword = completion.choices[0].message?.content?.trim() || "정보";
        console.log("AI Extracted Keyword:", keyword);

        // 3. [검색 단계] 네이버 블로그(3개) & 뉴스(2개) 병렬 호출
        const blogUrl = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=3&sort=sim`;
        const newsUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=2&sort=sim`;

        const headers = {
            "X-Naver-Client-Id": clientId,
            "X-Naver-Client-Secret": clientSecret,
        };

        const [blogRes, newsRes] = await Promise.all([
            fetch(blogUrl, { headers }),
            fetch(newsUrl, { headers })
        ]);

        if (!blogRes.ok || !newsRes.ok) {
            throw new Error("네이버 검색 API 호출 실패");
        }

        const blogData = await blogRes.json();
        const newsData = await newsRes.json();

        // 4. [가공 단계] HTML 태그 제거 및 포맷 통일
        // 네이버 API는 검색어 강조를 위해 <b>태그</b>를 포함해서 줍니다. 이를 제거해야 깔끔합니다.
        const cleanText = (text: string) => text.replace(/<[^>]*>?/gm, "").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

        const blogItems = blogData.items.map((item: NaverItem) => ({
            title: cleanText(item.title),
            description: cleanText(item.description),
            url: item.link,
            category: "Naver Blog"
        }));

        const newsItems = newsData.items.map((item: NaverItem) => ({
            title: cleanText(item.title),
            description: cleanText(item.description),
            url: item.link,
            category: "Naver News"
        }));

        // 5. 결과 합치기 (블로그 3개 + 뉴스 2개 = 총 5개)
        const recommendations = [...blogItems, ...newsItems];

        return NextResponse.json({
            success: true,
            data: { recommendations }
        });

    } catch (err: any) {
        console.error("AI/Naver Search Error:", err);
        return NextResponse.json({
            error: '처리 중 오류가 발생했습니다.',
            details: err.message
        }, { status: 500 });
    }
}
