export interface ServerCreateDto {
    ownerId: string;
    name: string;
    description: string | null;
    iconUrl: string | null;
    isPublic: boolean;
}