export default interface GroupMessage {
    messageId: string;
    senderId: string;
    groupId: string;
    content: string;
    sentAt: Date;
    readAt?: Date;
}