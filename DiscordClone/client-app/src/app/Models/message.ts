export default interface Message {
    messageId: string;
    content: string;
    createdAt: string;
    channelId: string;
    senderId: string;
    senderName: string;
    reaction: string;
}