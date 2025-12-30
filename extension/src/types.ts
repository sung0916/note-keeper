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
    page_title?: string;
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


export type FriendStatus = 'NONE' | 'ADDED' | 'BLOCKED';

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
    share_id: number;
    note_id: number;
    guest_id: string; // receiver
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    permission: 'READ' | 'WRITE';
}

export interface NoteWithMeta extends Note {
    is_shared?: boolean;
}
