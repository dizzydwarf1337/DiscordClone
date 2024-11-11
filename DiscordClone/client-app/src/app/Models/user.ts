
export interface User {
    id: string;
    email: string;
    avatarUrl: string | null;
    role: string;
    password?: string;
    createdAt: Date;
    bio: string | null;
    isOnline: boolean;
}