import { useState } from "react";
import { supabase } from "../../supabase";
import { Check, Edit2, X, Loader2 } from "lucide-react";

interface NicknameEditProps {
    userId: string;
    initialNickname: string;
    onUpdated: (newNickname: string) => void;
}

export default function NicknameEdit({ userId, initialNickname, onUpdated }: NicknameEditProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [nickname, setNickname] = useState(initialNickname);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!nickname.trim() || nickname === initialNickname) {
            setIsEditing(false);
            setNickname(initialNickname);
            return;
        }

        setIsLoading(true);
        try {
            // 1. DB 업데이트 (users 테이블)
            const { error: dbError } = await supabase
                .from('users')
                .update({ nickname: nickname.trim() })
                .eq('id', userId);

            if (dbError) throw dbError;

            // 2. Auth 세션 업데이트 (헤더 반영용)
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: nickname.trim() }
            });

            if (authError) throw authError;

            onUpdated(nickname.trim());
            setIsEditing(false);
            alert("닉네임이 변경되었습니다.");
        } catch (error) {
            console.error(error);
            alert("닉네임 변경 실패");
            setNickname(initialNickname);
        } finally {
            setIsLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
                <input
                    type="text"
                    autoFocus
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') {
                            setIsEditing(false);
                            setNickname(initialNickname);
                        }
                    }}
                    disabled={isLoading}
                    className="px-2 py-1 bg-white border border-blue-400 rounded text-sm font-bold text-gray-900 outline-none w-32 shadow-sm"
                />
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors disabled:opacity-50"
                    title="저장"
                >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                    onClick={() => {
                        setIsEditing(false);
                        setNickname(initialNickname);
                    }}
                    disabled={isLoading}
                    className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                    title="취소"
                >
                    <X size={14} />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setIsEditing(true)}
            className="group flex items-center gap-1.5 hover:bg-gray-50 px-1.5 py-0.5 -ml-1.5 rounded transition-colors text-left"
            title="닉네임 수정"
        >
            <span className="font-bold text-gray-900 text-base">{initialNickname}</span>
            <Edit2 size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
}
