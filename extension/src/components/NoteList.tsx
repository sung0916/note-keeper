import { supabase } from "../supabase";
import type { Note } from "../types";
import NoteItem from "./NoteItem";

interface NoteListProps {
    notes: Note[];
    loading: boolean;
    onRefresh: () => void;
}

export default function NoteList({ notes, loading, onRefresh }: NoteListProps) {
    const handleDelete = async (id: number) => {
        try {
            const { error } = await supabase.from('notes').delete().eq('note_id', id);
            if (error) throw error;
            onRefresh();

        } catch (e) {
            console.error(e);
        }
    }

    const handleAiAnalyze = async (note: Note) => {
        console.log('AI 추천 요청', note.content);
        // TODO: fetch('~~~~~~~~~~~/api/ai/recommend');
    };

    const handleOpen = (note: Note) => {
        console.log('메모열기: ', note);
    };

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
                <NoteItem
                    key={note.note_id}
                    note={note}
                    onDelete={handleDelete}
                    onEdit={handleOpen}
                    onAiAnalyze={handleAiAnalyze}
                />
            ))}
        </div>
    );
}
