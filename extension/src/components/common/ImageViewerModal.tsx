import { useState } from "react";
import { supabase } from "../../supabase";
import { Camera, Loader2, X } from "lucide-react";

interface ImageViewerModalProps {
    imageUrl?: string | null;
    isOwnProfile: boolean;
    userId?: string;
    onClose: () => void;
    onImageUpdated?: (newUrl: string) => void;
}

export default function ImageViewerModal({
    imageUrl, isOwnProfile, userId, onClose, onImageUpdated }: ImageViewerModalProps) {
    const [uploading, setUploading] = useState(false);
    const [displayUrl, setDisplayUrl] = useState(imageUrl);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0 || !userId) return;
            setUploading(true);

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/profile_${Date.now()}.${fileExt}`;

            // Storage 업로드
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);
            if (uploadError) throw uploadError;

            // Public URL 생성
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // DB 업데이트
            const { error: dbError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);
            if (dbError) throw dbError;

            const { error: authError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });
            if (authError) console.error("세션 메타데이터 업데이트 실패: ", authError);

            setDisplayUrl(publicUrl);
            if (onImageUpdated) onImageUpdated(publicUrl);
            alert("프로필 이미지가 변경되었습니다.");

        } catch (error) {
            console.error(error);
            alert("이미지 업로드 실패");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
            <button onClick={onClose} className="absolute right-6 top-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
                <X size={24} />
            </button>

            <div className="relative" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-full overflow-hidden border-4 border-white/20 shadow-2xl w-64 h-64 bg-gray-800 flex items-center justify-center relative">
                    {displayUrl ? (
                        <img src={displayUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-gray-400">No Image</span>
                    )}
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="animate-spin text-white" size={40} />
                        </div>
                    )}
                </div>

                {isOwnProfile && (
                    <label className="absolute bottom-2 right-2 cursor-pointer flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg">
                        <Camera size={18} />
                        <span className="text-sm font-bold">변경</span>
                        <input type="file" hidden accept="image/*" onChange={handleUpload} disabled={uploading} />
                    </label>
                )}
            </div>
        </div>
    );
}
