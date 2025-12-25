import { useState } from "react";
import { supabase } from "../supabase";
import { Save, X } from "lucide-react";

interface NoteModalPropts {
    pageUrl: string;
    pageTitle: string;
    onClose: () => void;
    onNoteSaved: () => void;
}

export default function NoteModal({ pageUrl, pageTitle, onClose, onNoteSaved }: NoteModalPropts) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) return;
        setIsSaving(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase.from('notes').insert({
                page_url: pageUrl,
                title: title,
                content: content,
                writer_id: session.user.id
            });

            if (error) throw error;
            onNoteSaved();

        } catch (e) { console.error(e); alert('저장이 실패하였습니다.') }
        finally { setIsSaving(false); }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">

            {/* 모달 박스 */}
            <div className="w-full h-[85%] sm:h-[600px] sm:w-[90%] bg-white rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">

                {/* 1. 모달 헤더 (수정됨) */}
                <div className="flex items-center justify-between p-4 border-b bg-white flex-shrink-0 gap-3">

                    {/* 왼쪽: 페이지 제목 표시 */}
                    <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mr-2 flex-shrink-0">
                            Write to
                        </span>
                        <h3 className="text-base font-bold text-gray-800 truncate leading-tight" title={pageUrl}>
                            {pageTitle}
                        </h3>
                    </div>

                    {/* 오른쪽: 닫기 버튼 */}
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors flex-shrink-0"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* 2. 입력 영역 (기존 유지) */}
                <div className="flex-1 p-4 bg-gray-50 flex flex-col gap-3 overflow-hidden">
                    <input
                        type="text"
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm text-base font-semibold placeholder-gray-400"
                        placeholder="제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />
                    <textarea
                        className="w-full flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white shadow-sm text-base placeholder-gray-400 leading-relaxed"
                        placeholder="메모 내용을 입력하세요..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>

                {/* 3. 하단 버튼 (기존 유지) */}
                <div className="p-4 border-t bg-white flex justify-end gap-2 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !content.trim()}
                        className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold shadow-md transition-colors disabled:bg-gray-300"
                    >
                        <Save size={18} />
                        {isSaving ? '저장 중...' : '메모 저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}
