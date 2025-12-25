export interface Note {
    note_id: number;
    writer_id: string;
    page_url: string;
    title: string;
    content: string;
    created_at: string;
}

export interface UserProfile {
    id: string;
    email: string;
    nickname?: string;
}
