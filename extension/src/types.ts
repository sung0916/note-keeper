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

export interface UserProfile {
    id: string;
    email: string;
    nickname?: string;
    avatar_url?: string;
}

export interface AiAnalysisResult {
    title: string;
    summary: string;
    keywords: string[];
    category: string;
    source: string;
    url: string;
    created_at: string;
}
