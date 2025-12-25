import { CheckSquare, MoreVertical, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface ActionBarProps {
    onAddClick: () => void;
    onDeleteAll: () => void;
    onDeleteSelected: () => void;
}

export default function ActionBar({ onAddClick, onDeleteAll, onDeleteSelected }: ActionBarProps) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white">
            <button
                onClick={onAddClick}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
            >
                <Plus size={18} />
                <span>Add</span>
            </button>

            <div className="relative">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <MoreVertical size={20} />
                </button>

                {showMenu && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white border rounded-lg shadow-lg z-20 overflow-hidden">
                            <button
                                onClick={() => { onDeleteSelected(); setShowMenu(false); }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <CheckSquare size={14} /> 선택 삭제
                            </button>
                            <button
                                onClick={() => { onDeleteAll(); setShowMenu(false); }}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 size={14} /> 전체 삭제
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}