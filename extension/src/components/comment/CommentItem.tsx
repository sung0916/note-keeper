import { useState } from "react";
import { useFriendship } from "../../hooks/useFriendship";
import { Share2, ShieldBan, ShieldCheck, Trash2, UserCircle2, UserMinus, UserPlus, XCircle, Check, Edit2 } from "lucide-react";
import type { Comment } from "../../types";

interface CommentItemProps {
    comment: Comment;
    currentUserId: string | null;
    isEditing: boolean;
    editString: string;
    onSetEditString: (text: string) => void;
    onStartEdit: (comment: Comment) => void;
    onSaveEdit: (commentId: number) => void;
    onCancelEdit: () => void;
    onDelete: (commentId: number) => void;
    onImageClick: (url: string | undefined, userId: string | undefined) => void;
    onOpenSharedMemos: (userId: string) => void;
}

export default function CommentItem({
    comment,
    currentUserId,
    isEditing,
    editString,
    onSetEditString,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onImageClick,
    onOpenSharedMemos
}: CommentItemProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // 작성자와의 관계 확인
    const {
        friendStatus, isLoading: isFriendLoading,
        addFriend, removeFriend, blockFriend, unblockFriend
    } = useFriendship(currentUserId, comment.writer_id);

    const isMe = currentUserId === comment.writer_id;
    const authorName = comment.users?.nickname || 'User';
    const authorAvatar = comment.users?.avatar_url;

    // 메뉴 닫기 유틸
    const closeMenu = (action: () => void) => {
        action();
        setIsMenuOpen(false);
    };

    return (
        <div className="flex gap-3 items-start group">
            {/* 이미지 뷰어 (본인이 아닐 때만 클릭 가능) */}
            <button
                onClick={() => !isMe && onImageClick(authorAvatar, comment.writer_id)}
                className={`w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 mt-1 overflow-hidden transition-all ${!isMe ? 'hover:ring-2 hover:ring-blue-100 cursor-pointer' : 'cursor-default'}`}
                disabled={isMe}
            >
                {authorAvatar ? (
                    <img src={authorAvatar} className="w-full h-full object-cover" alt={authorName} />
                ) : (
                    <UserCircle2 className="w-full h-full text-gray-400" />
                )}
            </button>

            <div className="flex-1 min-w-0">
                {isEditing ? (
                    /* 수정 모드 */
                    <div className="bg-white border-2 border-blue-500 rounded-2xl p-2 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                        <textarea
                            className="w-full text-sm p-1 bg-transparent focus:outline-none resize-none custom-scrollbar"
                            rows={3}
                            value={editString}
                            onChange={(e) => onSetEditString(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={onCancelEdit} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded">
                                <XCircle size={14} /> 취소
                            </button>
                            <button onClick={() => onSaveEdit(comment.comment_id)} className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                                <Check size={14} /> 저장
                            </button>
                        </div>
                    </div>
                ) : (
                    /* 뷰 모드 */
                    <div className="bg-gray-50 rounded-2xl px-4 py-3 relative">
                        {/* 헤더 */}
                        <div className="flex justify-between items-start mb-1">
                            <div className="relative">
                                {/* 닉네임 버튼 */}
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="text-xs font-bold text-gray-700 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                >
                                    {authorName}
                                    {isMe && <span className="text-[10px] text-gray-400 font-normal ml-1"> (나)</span>}
                                </button>

                                {/* 드롭다운 메뉴 (본인이 아닐 때만 표시) */}
                                {isMenuOpen && !isMe && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
                                        <div className="absolute left-0 top-6 w-48 bg-white border rounded-lg shadow-xl z-40 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                            <div className="px-4 py-2 border-b bg-gray-50">
                                                <p className="text-xs text-gray-500">작성자</p>
                                                <p className="text-sm font-bold truncate">{authorName}</p>
                                            </div>

                                            {friendStatus !== 'BLOCKED' && (
                                                <button
                                                    onClick={() => closeMenu(friendStatus === 'ADDED' ? removeFriend : addFriend)}
                                                    disabled={isFriendLoading}
                                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${friendStatus === 'ADDED' ? 'text-red-600 hover:bg-red-50' : 'text-blue-600 hover:bg-blue-50'
                                                        }`}
                                                >
                                                    {friendStatus === 'ADDED' ? <UserMinus size={14} /> : <UserPlus size={14} />}
                                                    {friendStatus === 'ADDED' ? "친구 삭제" : "친구 추가"}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => closeMenu(() => onOpenSharedMemos(comment.writer_id))}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                            >
                                                <Share2 size={14} /> 공유 중인 메모
                                            </button>
                                            <div className="border-t my-1"></div>
                                            <button
                                                onClick={() => closeMenu(friendStatus === 'BLOCKED' ? unblockFriend : blockFriend)}
                                                disabled={isFriendLoading}
                                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${friendStatus === 'BLOCKED' ? 'text-gray-600 hover:bg-gray-100' : 'text-red-600 hover:bg-red-50'
                                                    }`}
                                            >
                                                {friendStatus === 'BLOCKED' ? <ShieldCheck size={14} /> : <ShieldBan size={14} />}
                                                {friendStatus === 'BLOCKED' ? "차단 해제" : "차단하기"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            <span className="text-[10px] text-gray-400">
                                {new Date(comment.created_at).toLocaleString()}
                                {comment.updated_at && <span className="ml-1 text-gray-400 opacity-70">(수정됨)</span>}
                            </span>
                        </div>

                        <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">
                            {comment.content}
                        </p>
                    </div>
                )}
            </div>

            {/* Hover Actions */}
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                {isMe && !isEditing && (
                    <>
                        <button onClick={() => onStartEdit(comment)} className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded">
                            <Edit2 size={14} />
                        </button>
                        <button onClick={() => onDelete(comment.comment_id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                            <Trash2 size={14} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
