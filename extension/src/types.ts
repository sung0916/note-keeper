export interface UserProfile {
    id: string;
    email: string;
    nickname?: string;
    avatar_url?: string;
}

export interface Note {
    note_id: number;
    writer_id: string;
    page_url: string;
    title: string;
    content: string;
    created_at: string;
    bg_color?: string;
    text_color?: string;
    users?: UserProfile;
}

export interface Comment {
    comment_id: number;
    note_id: number;
    writer_id: string;
    content: string;
    created_at: string;
    updated_at?: string;
    users?: UserProfile;
}

export interface AiRecommendationItem {
    title: string;
    description: string;
    url: string;
    category: string;
}

export interface AiAnalysisResult {
    recommendations: AiRecommendationItem[];
}

export type FriendStatus = 'none' | 'added' | 'blocked';

export interface Friend {
    id: number;
    user_id: string;
    friend_id: string;
    status: FriendStatus;
    added_at: string;
}

export interface SearchUserResult {
    id: string;
    nickname: string;
    avatar_url: string;
}

export interface SharedNote {
    id: number;
    note_id: number;
    sender_id: string;
    receiver_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    permission: 'view' | 'edit';
}

export interface NoteWithMeta extends Note {
    is_shared?: boolean;
}
