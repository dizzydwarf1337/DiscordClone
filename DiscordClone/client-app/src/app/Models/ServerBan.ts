export default interface ServerBan {
    reason: string;
    serverId: string;
    banningUserId: string;
    bannedUserId: string;
}