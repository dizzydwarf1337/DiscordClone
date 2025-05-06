import { User } from "./user";

export interface FriendGroup {
    id: string;
    name: string;
    creatorId: string;
    members: User[];
}
