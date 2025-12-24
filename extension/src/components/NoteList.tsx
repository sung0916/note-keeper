import type { Note } from "../types";

interface NoteListProps {
    notes: Note[];
    loading: boolean;
}

export default function NoteList({ notes, loading }: NoteListProps) {
    if (loading) {
        return <div className="p-4 text-center text-gray-500 text-sm">로딩 중...</div>;
    }

    if (notes.length === 0) {
        return (
            <div className="p-8 text-center text-gray-400 text-sm">
                <p>아직 작성된 메모가 없습니다.</p>
                <p>첫 번째 메모를 남겨보세요!</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 p-2 space-y-2">
            {notes.map((note) => (
                <div key={note.note_id} className="bg-white p-3 rounded border shadow-sm">
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{note.content}</p>
                    <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                            {new Date(note.created_at).toLocaleString()}
                        </span>
                        {/* 추후 여기에 삭제/공유 버튼 추가 예정 */}
                    </div>
                </div>
            ))}
        </div>
    );
}