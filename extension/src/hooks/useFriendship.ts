import { useCallback, useEffect, useState } from "react";
import { type FriendStatus, type SearchUserResult } from "../types";
import { supabase } from "../supabase";

export function useFriendship(currentUserId: string | null, targetUserId?: string) {
    const [status, setStatus] = useState<FriendStatus>('none');
    const [isLoading, setIsLoading] = useState(false);

    // 친구 상태 확인
    const checkFriendStatus = useCallback(async () => {
        if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
            setStatus('none');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('friends')
                .select('status')
                .eq('user_id', currentUserId)
                .eq('friend_id', targetUserId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error("친구 상태 확인 에러:", error);
            }

            // 데이터가 있으면 해당 status, 없으면 'none'
            setStatus(data?.status as FriendStatus || 'none');
        } catch (e) { console.error(e); setStatus('none'); }
    }, [currentUserId, targetUserId]);

    // 친구 상태 변경 시 재확인
    useEffect(() => {
        checkFriendStatus();
    }, [checkFriendStatus]);

    // 친구 상태 변경
    const updateStatus = async (newStatus: 'added' | 'blocked') => {
        if (!currentUserId || !targetUserId) return;
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('friends')
                .upsert({
                    user_id: currentUserId,
                    friend_id: targetUserId,
                    status: newStatus,
                    added_at: new Date().toISOString()
                }, { onConflict: 'user_id, friend_id' });
            if (error) throw error;
            setStatus(newStatus);
        } catch (e) { console.error(`${newStatus} 변경 실폐: `, e); }
        finally { setIsLoading(false); }
    };

    // DB에서 삭제
    const removeRelation = async () => {
        if (!currentUserId || !targetUserId) return;
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('friends')
                .delete()
                .eq('user_id', currentUserId)
                .eq('friend_id', targetUserId);
            if (error) throw error;
            setStatus('none');
        } catch (e) { console.error('친구 상태 처리 실패: ', e); }
        finally { setIsLoading(false); }
    }

    const addFriend = () => updateStatus('added');
    const blockFriend = () => updateStatus('blocked');

    const removeFriend = () => {
        if (confirm("해당 유저를 친구 목록에서 삭제하시겠습니까?")) {
            removeRelation();
        }
    };
    const unblockFriend = () => removeRelation();

    // 유저 검색 (RPC 사용)
    const searchUserByEmail = async (email: string): Promise<SearchUserResult | null> => {
        if (!email.trim()) return null;

        try {
            const { data, error } = await supabase.rpc('get_user_by_email', {
                email_input: email
            });
            if (error) throw error;
            if (!data || data.length === 0) return null;

            return data[0] as SearchUserResult;
        } catch (e) { console.error('유저 검색 실패: ', e); return null; }
    };

    return {
        friendStatus: status,
        isLoading,
        addFriend,
        removeFriend,
        blockFriend,
        unblockFriend,
        searchUserByEmail
    };
}
