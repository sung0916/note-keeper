import { useState } from "react";
import { supabase } from "../../supabase";
import type { Note } from "../../types";
import NoteItem from "./NoteItem";
import NoteDetailModal from "./NoteDetailModal";

interface NoteListProps {
    notes: Note[];
    loading: boolean;
    onRefresh: () => void;
    onEditNote: (note: Note) => void;
    selectedNotes: Set<number>;
    onToggleSelect: (noteId: number) => void;
    isSelectionMode: boolean;
}

export default function NoteList({ notes, loading, onRefresh, onEditNote, selectedNotes, onToggleSelect, isSelectionMode }: NoteListProps) {
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [autoAi, setAutoAi] = useState(false);

    const handleDelete = async (id: number) => {
        if (!confirm('정말 메모를 삭제하시겠습니까?')) return;
        try {
            const { error } = await supabase.from('notes').delete().eq('note_id', id);
            if (error) throw error;
            onRefresh();
        } catch (e) { console.error(e); }
    }

    const handleOpenDetail = (note: Note) => {
        setAutoAi(false);
        setSelectedNote(note);
    };

    // AI 버튼 클릭
    const handleAiAnalyze = async (note: Note) => {
        setAutoAi(true);
        setSelectedNote(note);
    };

    const handleEditRequest = (note: Note) => {
        setSelectedNote(null);
        onEditNote(note);
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
        <>
            <div className="flex-1 overflow-y-auto bg-gray-50 p-2 space-y-2 select-none">
                {notes.map((note) => (
                    <NoteItem
                        key={note.note_id}
                        note={note}
                        onDelete={handleDelete}
                        onEdit={() => handleOpenDetail(note)}
                        onAiAnalyze={() => handleAiAnalyze(note)}
                        isSelected={selectedNotes.has(note.note_id)}
                        onToggleSelect={() => onToggleSelect(note.note_id)}
                        isSelectionMode={isSelectionMode}
                    />
                ))}
            </div>

            {/* 상세 보기 모달 */}
            {selectedNote && (
                <NoteDetailModal
                    note={selectedNote}
                    autoTriggerAi={autoAi}
                    onClose={() => {
                        setSelectedNote(null);
                        setAutoAi(false);
                    }}
                    onEdit={handleEditRequest}
                />
            )}
        </>
    );
}
