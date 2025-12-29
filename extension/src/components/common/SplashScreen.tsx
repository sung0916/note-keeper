import logo from '../../assets/note_keeper.png';

interface SplashScreenProps {
    isFadingOut: boolean;
}

export default function SplashScreen({ isFadingOut }: SplashScreenProps) {

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-splash-bg transition-opacity duration-500 ease-in-out ${
                isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
            {/* 로고 영역 */}
            <div className="mb-2">
                <img
                    src={logo}
                    alt="Note Keeper Logo"
                    className="w-40 h-40 object-cover rounded-[2.5rem] animate-logo-scale"
                />
            </div>

            {/* 텍스트 영역 */}
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
                노트 키퍼
            </h1>
            <p className="text-sm text-gray-500 font-medium tracking-wide">
                함께하는 메모, 더 쉬운 공유
            </p>

            <div className="absolute bottom-12 text-[10px] text-gray-400 font-light tracking-wider">
                Version 1.0.0
            </div>
        </div>
    );
}