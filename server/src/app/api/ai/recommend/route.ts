import { supabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: "AI 서비스 설정 오류" }, { status: 500 });
        }

        const { text, url } = await request.json();  // 클라이언트가 보낸 데이터 받기
        if (!text) {
            return NextResponse.json({ error: "텍스트 없음" }, { status: 400 });
        }

        const truncatedText = text.length > 100 ? text.slice(0, 100) + "..." : text;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `
                        You are a helpful assistant for a note-taking app.
                        Analyze the user's selected text from a webpage.
                        
                        Please provide the response in the following JSON format:
                        {
                        "summary": "A concise summary of the text in Korean (within 3 sentences).",
                        "keywords": ["Keyword1", "Keyword2", "Keyword3"],
                        "category": "The most relevant category (e.g., Tech, News, Health)."
                        }
                        
                        Keep the tone professional and helpful.
                    `
                },
                {
                    role: "user",
                    content: `
                        [Source URL]: ${url}
                        [Selected Text]: ${truncatedText}
                    `
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
            data: {
                summary: parsedResult.summary,
                keywords: parsedResult.keywords,
                category: parsedResult.category,
                url: url
            }
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
