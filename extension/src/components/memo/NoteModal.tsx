import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { Palette, Save, Type, X } from "lucide-react";
import ColorPicker from "../ColorPicker";
import type { Note } from "../../types";

interface NoteModalPropts {
    pageUrl: string;
    pageTitle: string;
    onClose: () => void;
    onNoteSaved: () => void;
    noteToEdit?: Note | null;
}

export default function NoteModal({ pageUrl, pageTitle, onClose, onNoteSaved, noteToEdit }: NoteModalPropts) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [bgColor, setBgColor] = useState('#FFFFFF');
    const [textColor, setTextColor] = useState('#000000');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (noteToEdit) {
            setTitle(noteToEdit.title);
            setContent(noteToEdit.content);
            setBgColor(noteToEdit.bg_color || '#FFFFFF');
            setTextColor(noteToEdit.text_color || '#000000');
        }
    }, [noteToEdit]);

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) return;
        setIsSaving(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            let error;
            if (noteToEdit) {
                const { error: updateError } = await supabase
                    .from('notes')
                    .update({
                        title,
                        content,
                        bg_color: bgColor,
                        text_color: textColor,
                    })
                    .eq('note_id', noteToEdit.note_id);
                error = updateError;

            } else {
                const { error: insertError } = await supabase
                    .from('notes')
                    .insert({
                        page_url: pageUrl,
                        page_title: pageTitle,
                        title: title,
                        content: content,
                        writer_id: session.user.id,
                        bg_color: bgColor,
                        text_color: textColor,
                    });
                error = insertError;
            }

            if (error) throw error;
            onNoteSaved();

        } catch (e) { console.error(e); alert('저장이 실패하였습니다.') }
        finally { setIsSaving(false); }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full h-[85%] sm:h-[600px] sm:w-[90%] bg-white rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">

                {/* 모달 헤더 */}
                <div className="flex items-center justify-between p-4 border-b bg-white flex-shrink-0 gap-3">
                    <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded mr-2 flex-shrink-0 ${noteToEdit ? "text-purple-600 bg-purple-50" : "text-blue-600 bg-blue-50"
                            }`}>
                            {noteToEdit ? "Edit" : "To"}
                        </span>
                        <h3 className="text-base font-bold text-gray-800 truncate leading-tight">
                            {noteToEdit ? "메모 수정" : (pageTitle || "제목 없음")}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors flex-shrink-0">
                        <X size={24} />
                    </button>
                </div>

                {/* 입력 영역 */}
                <div
                    className="flex-1 p-4 flex flex-col gap-3 overflow-hidden transition-colors duration-300"
                    style={{ backgroundColor: bgColor }}
                >
                    <input
                        type="text"
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 bg-transparent shadow-sm text-base font-semibold placeholder-gray-400"
                        placeholder="제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{ color: textColor }}
                        autoFocus
                    />
                    <textarea
                        className="w-full flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black/20 bg-transparent shadow-sm text-base placeholder-gray-400 leading-relaxed"
                        placeholder="메모 내용을 입력하세요..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        style={{ color: textColor }}
                    />
                </div>

                {/* 하단 버튼 영역 */}
                <div className="p-4 border-t bg-white flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <ColorPicker
                            icon={<Palette size={18} className="text-gray-600" />}
                            selectedColor={bgColor}
                            onSelect={setBgColor}
                            defaultColor="#FFFFFF"
                            label="배경색 변경"
                        />
                        <ColorPicker
                            icon={<Type size={18} className="text-gray-600" />}
                            selectedColor={textColor}
                            onSelect={setTextColor}
                            defaultColor="#000000"
                            label="글자색 변경"
                        />
                    </div>

                    <div className="flex gap-2">
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
        </div>
    );
}
