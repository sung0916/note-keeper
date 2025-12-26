import { RotateCcw } from "lucide-react";
import { useState } from "react";

const PALETTE = [
  '#FFF59D', '#FFE082', '#FFCC80', '#FFAB91', 
  '#E6EE9C', '#A5D6A7', '#80CBC4', '#81D4FA', 
  '#9FA8DA', '#CE93D8', '#F48FB1', '#FFAB91', 
  '#BCAAA4', '#D7CCC8', '#E0E0E0', '#546E7A', 
];

interface ColorPickerProps {
  icon: React.ReactNode;
  selectedColor: string;
  onSelect: (color: string) => void;
  defaultColor: string; // '기본' 버튼 눌렀을 때 돌아갈 색
  label: string; // 설명
}

export default function ColorPicker({ icon, selectedColor, onSelect, defaultColor, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* 1. 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg border hover:bg-gray-50 transition-colors flex items-center justify-center relative"
        title={label}
        style={{ borderColor: selectedColor !== defaultColor ? selectedColor : '#e5e7eb' }}
      >
        {icon}
        {/* 선택된 색상이 기본색이 아니면 작은 점으로 표시 */}
        {selectedColor !== defaultColor && (
          <span 
            className="absolute top-1 right-1 w-2 h-2 rounded-full border border-gray-300" 
            style={{ backgroundColor: selectedColor }}
          />
        )}
      </button>

      {/* 팔레트 모달 */}
      {isOpen && (
        <>
          {/* 외부 클릭 시 닫기 */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          <div className="absolute left-0 bottom-full mb-2 w-48 bg-white border rounded-xl shadow-xl z-20 p-3 animate-in slide-in-from-bottom-2 fade-in duration-200">
            
            {/* 색상 그리드 */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    onSelect(color);
                    setIsOpen(false);
                  }}
                  className={`w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform ${selectedColor === color ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <button
              onClick={() => {
                onSelect(defaultColor);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:bg-gray-100 py-1.5 rounded-md transition-colors border"
            >
              <RotateCcw size={12} />
              {defaultColor === '#FFFFFF' ? '흰색' : '검정'}으로 초기화
            </button>
          </div>
        </>
      )}
    </div>
  );
}
