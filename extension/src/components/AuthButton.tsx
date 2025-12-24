import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function AuthButton() {
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleGoogleLogin = async () => {
        console.log("👉 1. 버튼 클릭됨! 함수 시작");

        try {
            // 1. 환경변수 확인
            console.log("👉 2. Supabase 설정 확인:", {
                url: import.meta.env.VITE_SUPABASE_URL,
                hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
            });

            // 2. 크롬 런타임 ID 확인
            if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
                console.error("❌ 크롬 확장프로그램 환경이 아닙니다.");
                alert("확장프로그램 팝업에서 실행해주세요.");
                return;
            }
            console.log("👉 3. 확장프로그램 ID:", chrome.runtime.id);

            const redirectUrl = `https://${chrome.runtime.id}.chromiumapp.org/`;
            console.log("👉 4. 리다이렉트 URL:", redirectUrl);

            // 3. Supabase 로그인 URL 생성 요청
            console.log("👉 5. Supabase에 인증 URL 요청 중...");
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (error) {
                console.error("❌ Supabase 에러 발생:", error);
                throw error;
            }

            if (!data.url) {
                console.error("❌ 데이터는 왔는데 URL이 없음:", data);
                throw new Error('No URL returned');
            }

            console.log("👉 6. 인증 URL 수신 성공:", data.url);

            // 4. 크롬 인증 창 띄우기
            console.log("👉 7. chrome.identity.launchWebAuthFlow 실행");

            chrome.identity.launchWebAuthFlow(
                {
                    url: data.url,
                    interactive: true,
                },
                async (responseUrl) => {
                    // 콜백 함수 내부
                    console.log("👉 8. 구글 로그인 창 닫힘. 결과 URL:", responseUrl);

                    if (chrome.runtime.lastError) {
                        console.error("❌ 크롬 런타임 에러:", chrome.runtime.lastError.message);
                        return;
                    }

                    if (!responseUrl) {
                        console.error("❌ URL이 돌아오지 않음 (사용자가 창을 닫았을 수도 있음)");
                        return;
                    }

                    const params = new URLSearchParams(new URL(responseUrl).hash.substring(1));
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    console.log("👉 9. 토큰 파싱 결과:", { accessToken: !!accessToken, refreshToken: !!refreshToken });

                    if (!accessToken || !refreshToken) {
                        console.error("❌ 토큰이 없음");
                        return;
                    }

                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (sessionError) console.error("❌ 세션 저장 실패:", sessionError);
                    else console.log("✅ 로그인 최종 성공!");
                }
            );

        } catch (err) {
            console.error('❌ 전체 프로세스 중 에러 발생:', err);
            alert('로그인 처리 중 에러가 발생했습니다. 콘솔을 확인하세요.');
        }
    };

    // const handleGoogleLogin = async () => {
    //     try {
    //         const { data, error } = await supabase.auth.signInWithOAuth({
    //             provider: 'google',
    //             options: {
    //                 queryParams: {
    //                     access_type: 'offline',
    //                     prompt: 'consent',
    //                 },
    //                 redirectTo: `https://${chrome.runtime.id}.chromiumapp.org`,
    //                 skipBrowserRedirect: true,
    //             },
    //         });

    //         if (error) throw error;
    //         if (!data.url) throw new Error('No URL returned');

    //         chrome.identity.launchWebAuthFlow(
    //             {
    //                 url: data.url,
    //                 interactive: true,
    //             },
    //             async (redirectUrl) => {
    //                 if (chrome.runtime.lastError || !redirectUrl) return;
    //                 const params = new URLSearchParams(new URL(redirectUrl).hash.substring(1));
    //                 const accessToken = params.get('access_token');
    //                 const refreshToken = params.get('refresh_token');
    //                 if (!accessToken || !refreshToken) return;

    //                 await supabase.auth.setSession({
    //                     access_token: accessToken,
    //                     refresh_token: refreshToken,
    //                 });
    //             }
    //         );
    //     } catch (err) { console.error('Login error: ', err) };
    // };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    }

    if (session) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-gray-600 truncate max-w-[100px]">{session.user.email}</span>
                <button onClick={handleLogout} className="text-red-500 hover:text-red-700 underline">
                    로그아웃
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleGoogleLogin}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
        >
            Google 로그인
        </button>
    );
}