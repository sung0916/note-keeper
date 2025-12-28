import { useEffect, useState } from "react";
import { type Comment } from "../types";
import { supabase } from "../supabase";

export function useNoteComments(noteId: number, userId: string | null) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editString, setEditString] = useState("");

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select(`*, users (nickname, avatar_url, email)`)
            .eq('note_id', noteId)
            .order('created_at', { ascending: true });
        if (!error) setComments(data as any[] || []);
    };

    useEffect(() => {
        fetchComments();
    }, [noteId]);

    const sendComment = async () => {
        if (!commentText.trim() || isSending || !userId) return;
        setIsSending(true);
        try {
            const { error } = await supabase.from('comments').insert({
                note_id: noteId,
                writer_id: userId,
                content: commentText.trim()
            });
            if (error) throw error;
            setCommentText("");
            fetchComments();
            return true;
        } catch (e) { console.error(e); return false; }
        finally { setIsSending(false); }
    };

    const startEdit = (comment: Comment) => {
        setEditingCommentId(comment.comment_id);
        setEditString(comment.content);
    };

    const saveEdit = async (commentId: number) => {
        if (!editString.trim()) return;
        try {
            const { error } = await supabase
                .from('comments')
                .update({ content: editString.trim(), updated_at: new Date().toISOString() })
                .eq('comment_id', commentId);
            if (error) throw error;
            setEditingCommentId(null);
            fetchComments();
        } catch (e) { console.error(e); }
    };

    const deleteComment = async (commentId: number) => {
        if (!confirm('해당 글을 삭제하시겠습니까?')) return;
        const { error } = await supabase.from('comments').delete().eq('comment_id', commentId);
        if (!error) fetchComments();
    };

    return {
        comments,
        commentText,
        setCommentText,
        isSending,
        editingCommentId,
        setEditingCommentId,
        editString,
        setEditString,
        sendComment,
        startEdit,
        saveEdit,
        deleteComment,
        refreshComments: fetchComments
    };
}
