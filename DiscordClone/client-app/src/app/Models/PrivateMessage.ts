

export default interface PrivateMessage {
    messageId: string;
    senderId: string;
    receiverId: string;
    content: string;
    sentAt: Date;
    readAt?: Date;
}