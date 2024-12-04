export default interface ChatMessage {
    messageId: string, 
    content: string,
    createdAt: Date,
    isEdited: boolean,
    userName:string,
    channelId: string,
    serverId:string,
}
