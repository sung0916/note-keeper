import { useEffect, useRef, useState } from "react";
import { type Note } from "../../types";
import { Bookmark, ChevronDown, Edit2, List, MessageSquare, Send, Share2, ShieldBan, ShieldCheck, Sparkles, User, UserCircle2, UserMinus, UserPlus, X } from "lucide-react";
import { supabase } from "../../supabase";
import AiRecommendationList from "../AiRecommendationList";
import ImageViewerModal from "../common/ImageViewerModal";
import { useNoteComments } from "../../hooks/useNoteComments";
import { useNoteAi } from "../../hooks/useNoteAi";
import { useFriendship } from "../../hooks/useFriendship";
import CommentItem from "../comment/CommentItem";

interface NoteDetailModalProps {
    note: Note;
    autoTriggerAi?: boolean;
    onClose: () => void;
    onEdit: (note: Note) => void;
}

export default function NoteDetailModal({ note, autoTriggerAi = false, onClose, onEdit }: NoteDetailModalProps) {
    const [isComposing, setIsComposing] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isAuthorMenuOpen, setIsAuthorMenuOpen] = useState(false);
    const [viewingImage, setViewingImage] = useState<{ url: string; uid: string } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isMe = userId === note.writer_id;
    const authorName = note.users?.nickname || "Unknown User";
    const authorAvatar = note.users?.avatar_url;

    // Comments Hook
    const {
        comments, commentText, setCommentText, isSending,
        editingCommentId, setEditingCommentId, editString,
        setEditString, sendComment, startEdit, saveEdit, deleteComment
    } = useNoteComments(note.note_id, userId);

    // AI Hook
    const {
        showAiDropdown, setShowAiDropdown, recommendations,
        isLoading: isAiLoading, requestAi, refreshAi
    } = useNoteAi(note.page_url);

    // 친구 Hook
    const {
        friendStatus, addFriend, removeFriend,
        blockFriend, unblockFriend,
        isLoading: isFriendLoading,
    } = useFriendship(userId, note.writer_id);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
        if (autoTriggerAi) handleFabClick();
    }, [note.note_id, autoTriggerAi]);

    // 메모 모달 닫기
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 100);
    };

    // 이미지 뷰어 닫기
    const closeImageModal = () => {
        setIsImageModalOpen(false);
        setViewingImage(null);
    };

    // 이미지 클릭
    const handleImageClick = (url: string | undefined, uid: string | undefined) => {
        if (!url || !uid) return;
        setViewingImage({ url, uid });
        setIsImageModalOpen(true);
    };

    // 코멘트 작성
    const handleSendClick = async () => {
        const success = await sendComment();
        if (success) setIsComposing(false);
    };

    // 본문 AI 버튼
    const handleFabClick = async () => {
        if (showAiDropdown) setShowAiDropdown(false);
        else requestAi(note.content, 'note');
    };

    // 코멘트 AI 버튼
    const handleCommentAiClick = (commentContent: string) => {
        const combinedText = `[Note Context]" ${note.content}\n\n[User Comment]: ${commentContent}`;
        requestAi(combinedText, 'comment');
    };

    // 친구 메뉴 닫기
    const closeFriendMenu = (action: () => void) => {
        action();
        setIsAuthorMenuOpen(false);
    };

    return (
        <>
            <div className={`absolute inset-0 z-40 bg-white flex flex-col ${isClosing ? "animate-slide-out" : "animate-slide-in"}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                    <button onClick={handleClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-600" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            <MessageSquare size={12} />
                            <span>Comments ({comments.length})</span>
                        </div>
                        {isMe && (
                            <button onClick={() => onEdit(note)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                                <Edit2 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-32">
                    {/* Note Content Area */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4 break-words">{note.title}</h1>

                        {/* Author Info & Dropdown */}
                        <div className="flex items-center gap-3 relative">
                            <button
                                onClick={() => setIsImageModalOpen(true)}
                                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border hover:ring-2 hover:ring-blue-100"
                            >
                                {authorAvatar ? (
                                    <img src={authorAvatar} alt="profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle2 size={40} className="text-gray-400" />
                                )}
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setIsAuthorMenuOpen(!isAuthorMenuOpen)}
                                    className="text-left group flex items-center gap-1"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 flex items-center gap-1">
                                            {authorName}
                                            <ChevronDown size={12} className="text-gray-400 group-hover:text-blue-600" />
                                        </p>
                                        <p className="text-xs text-gray-500">{new Date(note.created_at).toLocaleString()}</p>
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {isAuthorMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsAuthorMenuOpen(false)} />
                                        <div className="absolute left-0 top-full mt-2 w-48 bg-white border rounded-lg shadow-xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                            <div className="px-4 py-2 border-b bg-gray-50">
                                                <p className="text-xs text-gray-500">{isMe ? "내 계정" : "작성자"}</p>
                                                <p className="text-sm font-bold truncate">{authorName}</p>
                                            </div>

                                            {isMe ? (
                                                <>
                                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2">
                                                        <User size={14} /> 친구 목록
                                                    </button>
                                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2">
                                                        <List size={14} /> 나의 메모
                                                    </button>
                                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2">
                                                        <Bookmark size={14} /> 북마크
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {friendStatus !== 'blocked' && (
                                                        <button
                                                            onClick={() => closeFriendMenu(friendStatus === 'added' ? removeFriend : addFriend)}
                                                            disabled={isFriendLoading}
                                                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${friendStatus === 'added'
                                                                ? 'text-red-600 hover:bg-red-50'
                                                                : 'text-blue-600 hover:bg-blue-50'
                                                                }`}
                                                        >
                                                            {friendStatus === 'added' ? <UserMinus size={14} /> : <UserPlus size={14} />}
                                                            {friendStatus === 'added' ? "친구 삭제" : "친구 추가"}
                                                        </button>
                                                    )}

                                                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                                        <Share2 size={14} /> 공유 중인 메모
                                                    </button>

                                                    <div className="border-t my-1"></div>

                                                    {/* 차단/차단해제 */}
                                                    <button
                                                        onClick={() => closeFriendMenu(friendStatus === 'blocked' ? unblockFriend : blockFriend)}
                                                        disabled={isFriendLoading}
                                                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${friendStatus === 'blocked'
                                                            ? 'text-gray-600 hover:bg-gray-100'
                                                            : 'text-red-600 hover:bg-red-50'
                                                            }`}
                                                    >
                                                        {friendStatus === 'blocked' ? <ShieldCheck size={14} /> : <ShieldBan size={14} />}
                                                        {friendStatus === 'blocked' ? "차단 해제" : "차단하기"}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100 mb-6" />
                    <div className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap mb-10 w-full break-words" style={{ color: note.text_color || 'inherit' }}>
                        {note.content}
                    </div>

                    {/* Comment List Area */}
                    <div className="space-y-4 mb-4">
                        {comments.map((comment) => (
                            <CommentItem
                                key={comment.comment_id}
                                comment={comment}
                                currentUserId={userId}
                                isEditing={editingCommentId === comment.comment_id}
                                editString={editString}
                                onSetEditString={setEditString}
                                onStartEdit={startEdit}
                                onSaveEdit={saveEdit}
                                onCancelEdit={() => setEditingCommentId(null)}
                                onDelete={deleteComment}
                                onAiClick={handleCommentAiClick}
                                onImageClick={handleImageClick}
                            />
                        ))}
                    </div>
                </div>

                {/* AI Dropup */}
                {showAiDropdown && (
                    <AiRecommendationList
                        noteId={note.note_id}
                        recommendations={recommendations}
                        loading={isAiLoading}
                        onClose={() => setShowAiDropdown(false)}
                        onRefresh={refreshAi}
                        bottomPosition={isComposing ? "180px" : "160px"}
                    />
                )}

                {/* FAB (Floating Action Button) */}
                <button
                    onClick={handleFabClick}
                    disabled={isAiLoading}
                    className={`absolute right-6 w-10 h-10 rounded-full shadow-lg transition-all flex items-center justify-center z-50 group ${isAiLoading ? "bg-gray-400" : "bg-gradient-to-br from-indigo-600 to-blue-500 text-white"} ${isComposing ? "bottom-32" : "bottom-24"}`}
                >
                    {isAiLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={15} className="group-hover:rotate-12" />}
                </button>

                {/* Comment Input Area */}
                <div className={`border-t bg-white p-3 shadow-sm z-20 transition-all duration-300 ${isComposing ? "h-32" : "h-[76px]"}`}>
                    <div className="relative w-full h-full flex gap-2 items-start">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 mt-1">
                            <UserCircle2 className="w-full h-full text-gray-400" />
                        </div>
                        <div className="flex-1 relative h-full">
                            <textarea
                                ref={textareaRef}
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onFocus={() => setIsComposing(true)}
                                onBlur={() => !commentText.trim() && setIsComposing(false)}
                                placeholder="코멘트를 남겨보세요..."
                                className={`w-full bg-gray-100 border-0 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all resize-none custom-scrollbar ${isComposing ? "h-full" : "h-11 overflow-hidden"}`}
                            />
                            <button
                                onClick={handleSendClick}
                                disabled={!commentText.trim() || isSending}
                                className={`absolute right-2 p-1.5 rounded-full transition-all ${commentText.trim() ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-500"} ${isComposing ? "bottom-3" : "top-1"}`}
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isImageModalOpen && viewingImage && (
                <ImageViewerModal
                    imageUrl={viewingImage.url}
                    isOwnProfile={viewingImage.uid === userId}
                    userId={viewingImage.uid === userId ? userId : undefined}
                    onClose={closeImageModal}
                    onImageUpdated={() => window.location.reload()}
                />
            )}
        </>
    );
}
