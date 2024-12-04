import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import ChatMessage from "../Models/ChatMessage";
import { makeAutoObservable } from "mobx";


export default class SignalRStore {
    connection: HubConnection | null = null;
    messages: ChatMessage[] = [];
    chat: Object = {};
    constructor() {
        makeAutoObservable(this);
        this.startConnection();
    }
    startConnection = async () => {
        try {
            this.connection = new HubConnectionBuilder()
                .withUrl("http://localhost:5000/ChatHub", {
                    accessTokenFactory: () => localStorage.getItem("token") || ""
                })
                .withAutomaticReconnect()
                .build();
            await this.connection.start();
            console.log("Connection started");
            await this.joinChannel();
            this.connection.on("ReceiveMessage", (message: { id:string,userName: string, content: string,server:string,channel:string }) => {
                const newMessage: ChatMessage = {
                    messageId: message.id,
                    userName: message.userName,
                    content: message.content,
                    createdAt: new Date(),
                    isEdited:false,
                    channelId:message.channel,
                    serverId:message.server
                };
                this.messages.push(newMessage);
            });
        }
        catch (error) {
            console.error(error);
        }
    }
    stopConnection = async () => {
        try {
            await this.connection?.stop();
            console.log("Connection stopped");
        } catch (error) {
            console.error("Error stopping connection", error);
        }
    };

    sendMessage = async (message: ChatMessage) => {
        try {
            await this.connection?.invoke("SendMessage", message);
        }
        catch (error) {
            console.error(error);
        }
    }
    joinChannel = async () => {
        if (this.connection) {
            try {
                await this.connection.invoke("JoinChannel", "Server1", "General");
                console.log("Channel joined successfully");
            } catch (error) {
                console.error("Error joining channel:", error);
            }
        }
    };
    getMessages = () => this.messages;
    clearMessages = () => this.messages = [];

}