import { Bookmark, Check, ChevronDown, Copy, List, LogOut, User, UserCircle2 } from "lucide-react";
import { useState } from "react";
import AuthButton from "./AuthButton";
import ImageViewerModal from "./ImageViewerModal";
import FriendListModal from "../user/FriendListModal";
import MemoListModal from "../user/MemoListModal";
import BookmarkListModal from "../user/BookmarkListModal";

interface HeaderProps {
    session: any;
    pageTitle: string;
    currentUrl: string;
    onLogout: () => void;
}

export default function Header({ session, pageTitle, currentUrl, onLogout }: HeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
    const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
    const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(currentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const nickname = session?.user?.user_metadata?.full_name ||
        session?.user?.user_metadata?.name ||
        session?.user?.email?.split('@')[0] || 'User';
    const avatarUrl = session?.user?.user_metadata?.avatar_url;

    return (
        <>
            <div className="flex items-center justify-between p-3 border-b bg-white h-14 shadow-sm z-20">
                <div className="flex items-center flex-1 min-w-0 mr-4">
                    <button onClick={handleCopyUrl} className="mr-2 p-1 text-gray-400 hover:text-blue-500 rounded-md transition-colors flex-shrink-0">
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                    <h2 className="text-sm font-semibold text-gray-800 truncate cursor-default" title={pageTitle}>
                        {pageTitle || "Note Keeper"}
                    </h2>
                </div>

                {!session ? (
                    <div className="scale-90 origin-right"><AuthButton /></div>
                ) : (
                    <div className="flex items-center gap-2">
                        {/* 아바타 버튼 추가 */}
                        <button
                            onClick={() => setIsImageModalOpen(true)}
                            className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-200 hover:ring-2 hover:ring-blue-100 transition-all flex-shrink-0"
                        >
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="me" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle2 className="w-full h-full text-gray-400" />
                            )}
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
                            >
                                <span className="font-medium max-w-[80px] truncate">{nickname}</span>
                                <ChevronDown size={14} className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-white border rounded-lg shadow-xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        <div className="px-4 py-2 border-b bg-gray-50">
                                            <p className="text-xs text-gray-500">내 계정</p>
                                            <p className="text-sm font-bold truncate">{nickname}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsFriendModalOpen(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                                        >
                                            <User size={14} /> 친구 목록
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsMemoModalOpen(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                                        >
                                            <List size={14} /> 메모 목록
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setIsBookmarkModalOpen(true);
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                                        >
                                            <Bookmark size={14} /> 북마크
                                        </button>
                                        <div className="border-t my-1"></div>
                                        <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut size={14} /> 로그아웃</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 이미지 뷰어 모달 */}
            {isImageModalOpen && (
                <ImageViewerModal
                    imageUrl={avatarUrl}
                    isOwnProfile={true}
                    userId={session.user.id}
                    onClose={() => setIsImageModalOpen(false)}
                />
            )}

            {/* 친구 목록 모달 */}
            {isFriendModalOpen && (
                <FriendListModal
                    onClose={() => setIsFriendModalOpen(false)}
                    currentUser={{
                        name: nickname,
                        avatarUrl: avatarUrl,
                        id: session?.user?.id
                    }}
                />
            )}

            {/* 메모 목록 모달 */}
            {isMemoModalOpen && session?.user?.id && (
                <MemoListModal
                    userId={session.user.id}
                    currentUrl={currentUrl}   
                    currentPageTitle={pageTitle} 
                    onClose={() => setIsMemoModalOpen(false)}
                />
            )}

            {/* 북마크 목록 모달 */}
            {isBookmarkModalOpen && session?.user?.id && (
                <BookmarkListModal
                    userId={session.user.id}
                    onClose={() => setIsBookmarkModalOpen(false)}
                />
            )}
        </>
    );
}
