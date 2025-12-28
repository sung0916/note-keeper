import { supabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(request: Request) {

    try {
        const authHeader = request.headers.get("Authorization");  // 헤더에서 Authorization 토큰 추출
        if (!authHeader) {
            return NextResponse.json({ error: "토큰 없음" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);  // Supabase를 통해 토큰 검증 및 유저 정보 가져오기
        if (authError || !user) {
            return NextResponse.json({ error: "유효하지 않은 사용자" }, { status: 401 });
        }
        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({ error: "AI 서비스 설정 오류" }, { status: 500 });
        }

        const { text, url, contextType } = await request.json();  // 클라이언트가 보낸 데이터 받기
        if (!text) {
            return NextResponse.json({ error: "텍스트 없음" }, { status: 400 });
        }

        const truncatedText = text.length > 100 ? text.slice(0, 100) + "..." : text;

        const completion = await openai.chat.completions.create({
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `
                        You are a research assistant.
                        Analyze the provided text and recommend 5 relevant external resources (articles, documentation, or blog posts) that would help the user understand or expand on the topic.
                        
                        The context is: ${contextType === 'comment' ? 'User Comment + Note Content' : 'Note Content only'}.
                        
                        Return a JSON object with a "recommendations" array containing 5 items.
                        Each item must have:
                        - "title": A clear, catchy title (in Korean).
                        - "description": A short summary of what this resource contains (max 2 sentences, in Korean).
                        - "url": A plausible URL (e.g., specific documentation or a valid-looking blog path). If unsure, use a Google Search URL query.
                        - "category": e.g., "Tech", "Design", "News".

                        Example Format:
                        {
                          "recommendations": [
                            {
                              "title": "React 상태 관리 가이드",
                              "description": "Redux와 Context API의 차이점을 설명합니다.",
                              "url": "https://react.dev/learn/managing-state",
                              "category": "Development"
                            }
                          ]
                        }
                    `
                },
                {
                    role: "user",
                    content: `[Content]: ${truncatedText}`
                },
            ],
        });

        const aiContent = completion.choices[0].message?.content;
        if (!aiContent) {
            throw new Error("AI 응답 없음");
        }

        const parsedResult = JSON.parse(aiContent as string);

        return NextResponse.json({
            success: true,
            data: { recommendations: parsedResult.recommendations }
        });

    } catch (err: any) {
        console.error(err);
        const errorMessage = err.response?.data?.error?.message || err.message || 'Unknown Server Error';

        return NextResponse.json({
            error: 'AI 요청 처리 중 오류가 발생했습니다.',
            details: errorMessage
        }, { status: 500 });
    }
}
