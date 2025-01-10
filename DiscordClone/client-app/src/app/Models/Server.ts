export interface Server {
    serverId: string;
    name: string;
    description: string | null;
    iconUrl: string | null;
    isPublic: boolean;
}