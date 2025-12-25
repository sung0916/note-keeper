import { Bookmark, Check, ChevronDown, Copy, List, LogOut, User } from "lucide-react";
import { useState } from "react";
import AuthButton from "./AuthButton";

interface HeaderProps {
    session: any;
    pageTitle: string;
    currentUrl: string;
    onLogout: () => void;
}

export default function Header({ session, pageTitle, currentUrl, onLogout }: HeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(currentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const nickname = session?.user?.user_metadata?.full_name ||
        session?.user?.user_metadata?.name ||
        session?.user?.email?.split('@')[0] || 'User';

    return (
        <div className="flex items-center justify-between p-3 border-b bg-white h-14 shadow-sm z-20">

            {/* 페이지 제목 */}
            <div className="flex items-center flex-1 min-w-0 mr-4">
                <button
                    onClick={handleCopyUrl}
                    className="mr-2 p-1 text-gray-400 hover:text-blue-500 rounded-md transition-colors flex-shrink-0"
                    title="URL 복사"
                >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>

                <h2
                    className="text-sm font-semibold text-gray-800 truncate cursor-default"
                    title={pageTitle}
                >
                    {pageTitle || "Note Keeper"}
                </h2>
            </div>

            {/* 오른쪽: 로그인 상태에 따라 버튼 또는 유저 메뉴 */}
            {!session ? (
                <div className="scale-90 origin-right">
                    <AuthButton />
                </div>
            ) : (
                <div className="relative">
                    {/* 유저 닉네임 버튼 */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
                    >
                        <span className="font-medium max-w-[80px] truncate">{nickname}</span>
                        <ChevronDown size={14} className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* 드롭다운 메뉴 */}
                    {isMenuOpen && (
                        <>
                            {/* 외부 클릭 시 닫기 위한 투명 배경 */}
                            <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />

                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border rounded-lg shadow-xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <div className="px-4 py-2 border-b bg-gray-50">
                                    <p className="text-xs text-gray-500">내 계정</p>
                                    <p className="text-sm font-bold truncate">{nickname}</p>
                                </div>

                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2">
                                    <User size={14} /> 친구 목록
                                </button>
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2">
                                    <List size={14} /> 메모 목록
                                </button>
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2">
                                    <Bookmark size={14} /> 북마크
                                </button>

                                <div className="border-t my-1"></div>

                                <button
                                    onClick={onLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <LogOut size={14} /> 로그아웃
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}