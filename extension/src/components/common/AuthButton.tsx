import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../../supabase";

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

    async function sha256(plain: string) {  // Skip nonce check 대비로 SHA-256 해싱
        const encoder = new TextEncoder();
        const data = encoder.encode(plain);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }

    const handleGoogleLogin = async () => {
        try {
            const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            if (!GOOGLE_CLIENT_ID) return;

            const rawNonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
            const nonce = rawNonce.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');  // URL 특수문자 제거
            const hashedNonce = await sha256(nonce);
            const extensionId = chrome.runtime.id;
            const redirectUrl = `https://${extensionId}.chromiumapp.org/`;

            const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');  // 구글 인증 URL
            authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
            authUrl.searchParams.set('response_type', 'id_token');
            authUrl.searchParams.set('redirect_uri', redirectUrl);
            authUrl.searchParams.set('scope', 'openid email profile');
            authUrl.searchParams.set('nonce', hashedNonce);
            authUrl.searchParams.set('prompt', 'select_account');

            chrome.identity.launchWebAuthFlow(  // 로그인 창 팝업
                {
                    url: authUrl.toString(),
                    interactive: true,
                },
                async (responseUrl) => {
                    if (chrome.runtime.lastError || !responseUrl) {
                        console.error(chrome.runtime.lastError);
                        return;
                    }

                    const url = new URL(responseUrl);
                    const params = new URLSearchParams(url.hash.substring(1));  // 토큰 추출
                    const idToken = params.get('id_token');
                    if (!idToken) {
                        console.error('ID Token 없음');
                        return;
                    }

                    const { error } = await supabase.auth.signInWithIdToken({  // Supabase 로그인
                        provider: 'google',
                        token: idToken,
                        nonce: rawNonce,
                    });
                    if (error) { alert('로그인 실패'); return; }
                    else { console.log('로그인 성공'); }
                }
            );
        } catch (err) {
            console.error('로직 에러', err);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    }
    if (session) {
        const displayName =
            session.user.user_metadata.full_name ||
            session.user.user_metadata.name ||
            session.user.email;
        return (
            <div className="flex items-center gap-2">
                <span className="text-gray-600 truncate max-w-[100px]">{displayName}</span>
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
