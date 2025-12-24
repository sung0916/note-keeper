import { useState } from "react";
import { supabase } from "../supabase";

interface NoteInputProps {
    pageUrl: string;
    onNoteSaved: () => void;
}

export default function NoteInput({ pageUrl, onNoteSaved }: NoteInputProps) {
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!content.trim()) return;
        if (!pageUrl) {
            alert("페이지 URL을 가져오지 못했습니다.");
            return;
        }

        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("로그인이 필요합니다.");
                return;
            }

            const { error } = await supabase.from('notes').insert({
                page_url: pageUrl,
                content: content,
                writer_id: session.user.id
            });
            if (error) throw error;

            setContent('');
            onNoteSaved();

        } catch (e) {
            console.error(e);
            alert('메모 저장 실패');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 border-b bg-white">
            <textarea
                className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3}
                placeholder="이 페이지에 대한 메모를 남기세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <div className="mt-2 text-right">
                <button
                    onClick={handleSave}
                    disabled={isSaving || !content.trim()}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300"
                >
                    {isSaving ? '저장 중...' : '메모 저장'}
                </button>
            </div>
        </div>
    );
}
