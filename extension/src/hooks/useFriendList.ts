import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";

export interface FriendDisplay {
    id: number; // relation id
    friendUserId: string; // friend's user_id
    name: string;
    googleId: string;
    avatarUrl?: string;
    isOnline?: boolean;
    status: 'ADDED' | 'BLOCKED';
}

export function useFriendList(userId: string | null) {
    const [friends, setFriends] = useState<FriendDisplay[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchFriends = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('friends')
                .select(`
                    id,
                    friend_id,
                    status,
                    users:friend_id (
                        id,
                        email,
                        nickname,
                        avatar_url
                    )
                `)
                .eq('user_id', userId)
                .in('status', ['ADDED', 'BLOCKED']);

            if (error) throw error;

            const formattedFriends: FriendDisplay[] = (data || []).map((item: any) => ({
                id: item.id,
                friendUserId: item.friend_id,
                name: item.users?.nickname || item.users?.email?.split('@')[0] || 'Unknown',
                googleId: item.users?.email || '',
                avatarUrl: item.users?.avatar_url,
                isOnline: false,
                status: item.status
            }));

            setFriends(formattedFriends);
        } catch (e) {
            console.error("Failed to fetch friends:", e);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchFriends();
    }, [fetchFriends]);

    return { friends, isLoading, refresh: fetchFriends, setFriends };
}
