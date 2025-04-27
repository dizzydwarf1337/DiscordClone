import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { makeAutoObservable, runInAction } from "mobx";
import Message from "../Models/message";
import agent from "../API/agent";
import PrivateMessage from "../Models/PrivateMessage";

export default class SignalRStore {
    connection: HubConnection | null = null;
    messages: Map<string, Message[]> = new Map();
    privateMessages: Map<string, PrivateMessage[]> = new Map();
    currentChannel: string = "";
    currentServer: string = "";
    isConnected: boolean = false;
    constructor() {
        makeAutoObservable(this);

        if (localStorage.getItem('user') && !this.isConnected) {
            this.startConnection().then(() => {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const userId = user.id;
                this.connectToUserChannels(userId);
            });
        }
    }

    startConnection = async () => {
        if (this.connection == null && !this.isConnected) {
            try {
                this.connection = new HubConnectionBuilder()
                    .withUrl("http://localhost:5000/ChatHub", {
                        accessTokenFactory: () => localStorage.getItem("token") || ""
                    })
                    .withAutomaticReconnect()
                    .build();

                await this.connection.start();
                runInAction(() => {
                    this.isConnected = true;
                });

                console.log("Connection started");
                this.connection.on("ReceivePrivateMessage", this.handleReceivePrivateMessage);
                this.connection.on("ReceiveMessage", this.handleReceiveMessage);

                const user = JSON.parse(localStorage.getItem("user") || "{}");
                const userId = user.id;
                try {
                    await this.connection.invoke("SetUserId", userId);
                } catch (error) {
                    console.error("Failed to invoke SetUserId:", error);
                }

                this.connection.onreconnected(() => {
                    console.log("Reconnected to the server.");
                    runInAction(() => this.isConnected = true);
                });

                this.connection.onclose(() => {
                    console.log("Disconnected. Attempting to reconnect...");
                    runInAction(() => this.isConnected = false);
                    setTimeout(this.startConnection, 5000);
                });
            } catch (error) {
                console.error("Connection failed, retrying...", error);
                setTimeout(this.startConnection, 5000);
            }
        }
    };

    stopConnection = async () => {
        try {
            await this.connection?.stop();
            this.isConnected = false;
            console.log("Connection stopped");
        } catch (error) {
            console.error("Error stopping connection", error);
        }
    };

    sendMessage = async (message: Message, channelName: string, serverName: string) => {
        if (!this.connection) {
            console.error("Not connected to a channel");
            return;
        }
        try {
            await agent.Messages.SendMessage(message);

            console.log("Message sent");
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };
    sendPrivateMessage = async (message: PrivateMessage) => {
        if (!this.connection) {
            console.error("Not connected to a channel");
            return;
        }
        try {
            await agent.Messages.SendPrivateMessage(message);
            console.log("Private message sent");
        } catch (error) {
            console.error("Error sending private message:", error);
        }
    }
    joinChannel = async (serverName: string, channelName: string) => {
        if (!this.connection) {
            console.error("Connection not established");
            return;
        }
        try {
            this.currentServer = serverName;
            this.currentChannel = channelName;
            const groupName = `${serverName}:${channelName}`;
            await this.connection.invoke("JoinChannel", groupName);
            console.log(`Successfully joined channel ${channelName} on server ${serverName}`);
        } catch (error) {
            console.error("Error joining channel:", error);
        }
    };

    connectToUserChannels = async (userId: string) => {
        if (!this.connection) {
            console.error("Connection not established");
            return;
        }
        var userChannels = await agent.Channels.GetUserChannels(userId || "");
        for (const groupName of userChannels) {
            try {
                await this.connection.invoke("JoinChannel", groupName);
                console.log(`Connected to group: ${groupName}`);
            } catch (error) {
                console.error(`Failed to connect to group: ${groupName}`, error);
            }
        }
    };

    refreshFriendGroups = async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id;

        if (!userId) {
            console.error("User ID not found in local storage");
            return;
        }

        try {
            const friendGroups = await this.friendStore.getFriendGroupsByUserId(userId);
            runInAction(() => {
            this.friendStore.setFriendGroups(friendGroups);
            });
            console.log("Friend store refreshed with new friend groups");
        } catch (error) {
            console.error("Error refreshing friend store:", error);
        }
    };

    handleReceiveNotification = (notification: NotificationDto) => {
        console.log("🔔 Notification received:", notification);
        switch (notification.type) {
            case "NewPrivateMessage":
                console.log("New private message notification:", notification);
                break;
            case "AddedToGroup":
                console.log("Added to group notification:", notification);
                this.refreshFriendGroups();
                break;
            case "KickedFromGroup":
                console.log("❌ You were kicked from the group:", notification.payload.groupId);
                if (typeof notification.payload === 'object' && notification.payload !== null && 'groupId' in notification.payload) {
                    const groupId = notification.payload.groupId;        

                    if (window.location.pathname.includes(`/main/group/${groupId}`)) {
                        window.location.href = "/main";
                    }
                }
                break;
        }
    };

    sendMessageWithAttachments = async (content: string, channelId: string, senderId: string, files: FileList | null): Promise<Message | null> => {
        if (!this.connection) {
            console.error("Not connected");
            return null;
        }

        try {
            const formData = new FormData();
            formData.append('content', content);
            formData.append('channelId', channelId);
            formData.append('senderId', senderId);

            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    formData.append('files', files[i]);
                }
            }

            const response = await agent.Messages.SendMessageWithAttachments(formData);
            return response; // Zakładając, że API zwraca obiekt Message
        } catch (error) {
            console.error("Error sending message with attachments:", error);
            return null;
        }
    };
    /*
    sendMessageWithAttachments = async (content: string, channelId: string, senderId: string, files: FileList | null) => {
        if (!this.connection) {
            console.error("Not connected");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('content', content);
            formData.append('channelId', channelId);
            formData.append('senderId', senderId);

            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    formData.append('files', files[i]);
                }
            }

            await agent.Messages.SendMessageWithAttachments(formData);
            console.log("Message with attachments sent");
        } catch (error) {
            console.error("Error sending message with attachments:", error);
        }
    };*/

    // Update the existing handler to support attachments
    handleReceiveMessage = (message: Message) => {
        runInAction(() => {
            const currentMessages = this.messages.get(message.channelId) || [];
            this.messages.set(message.channelId, [...currentMessages, message]);
            console.log("Message received with attachments:", message.attachments?.length || 0);
        });
    };
    handleReceivePrivateMessage = (message: PrivateMessage) => {
        let key = [message.senderId, message.receiverId].sort().join("-");
        runInAction(() => {
            console.log("Message received");
            const currentMessages = this.privateMessages.get(key) || [];
            this.privateMessages.set(key, [...currentMessages, message]);
            console.log("Private messages updated:", this.privateMessages);
        });
    };
    clearMessages = () => {
        this.messages.clear();
    };
}
