import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { action, makeAutoObservable, observable, ObservableMap, runInAction } from "mobx";
import Message from "../Models/message";
import agent from "../API/agent";
import PrivateMessage from "../Models/PrivateMessage";
import GroupMessage from "../Models/GroupMessage";
import { NotificationDto } from "../Models/NotificationDto";
import FriendStore  from "./friendStore";
import { MarkAsReadDto } from "../Models/MarkAsReadDto";

export default class SignalRStore {
    connection: HubConnection | null = null;
    messages: Map<string, Message[]> = new Map();
    privateMessages: Map<string, PrivateMessage[]> = new Map();
    groupMessages: Map<string, GroupMessage[]> = new Map();
    currentChannel: string = "";
    currentServer: string = "";
    isConnected: boolean = false;
    friendStore: FriendStore;
    unreadPrivateMessages: Map<string, number> = new Map();
    unreadGroupMessages: Map<string, number> = new Map();
    constructor(friendStore: FriendStore) {
        makeAutoObservable(this);
        this.friendStore = friendStore;

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
                this.connection.on("ReceiveGroupMessage", this.handleReceiveGroupMessage);
                this.connection.on("ReceiveNotification", this.handleReceiveNotification);

                const user = JSON.parse(localStorage.getItem("user") || "{}");
                const userId = user.id;
                await this.initializeUnreadCounts(userId);
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

    async initializeUnreadCounts(userId: string) {
        try {
            const privateUnreads = await agent.Messages.GetUnreadPrivateMessageCounts(userId);
            console.log("Private unreads:", privateUnreads);
            runInAction(() => {
                privateUnreads.forEach(({key, count}: { key: string; count: number }) => {
                    this.unreadPrivateMessages.set(key, count);
                });
            });
    
            const groupUnreads = await agent.Messages.GetUnreadGroupMessageCounts(userId);
            console.log("Group unreads:", groupUnreads);
            runInAction(() => {
                groupUnreads.forEach(({groupId, count}: { groupId: string; count: number }) => {
                    this.unreadGroupMessages.set(groupId, count);
                });
            });
        } catch (error) {
            console.error("Error initializing unread counts:", error);
        }
    }

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
    sendGroupMessage = async (message: GroupMessage) => {
        if (!this.connection) {
            console.error("Not connected to a group");
            return;
        }
        try {
            console.log("sending: " ,message)
            await agent.Messages.SendGroupMessage(message);
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

    joinGroup = async (groupId: string) => {
        if (!this.connection) {
            console.error("Connection not established");
            return;
        }
        try {
            await this.connection.invoke("JoinChannel", groupId);
            console.log(`✅ Successfully joined group: ${groupId}`);
        } catch (error) {
            console.error("❌ Error joining group:", error);
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
                const privateMsg = notification.payload.messageDto;
                const key = [privateMsg.senderId, privateMsg.receiverId].sort().join("-");
                if (!window.location.pathname.includes(`/main/friend/${key}`)) {
                runInAction(() => {
                    const currentUnread = this.unreadPrivateMessages.get(key) || 0;
                    this.unreadPrivateMessages.set(key, currentUnread + 1);
                });
            }
                break;
                
            case "NewGroupMessage":
                const groupMsg = notification.payload.messageDto;
                const groupId = groupMsg.groupId;
                if (!window.location.pathname.includes(`/main/group/${groupId}`)) {
                    runInAction(() => {
                        const currentUnread = this.unreadGroupMessages.get(groupId) || 0;
                        this.unreadGroupMessages.set(groupId, currentUnread + 1);
                    });
                }
                break;
            case "AddedToGroup":
                console.log("Added to group notification:", notification);
                this.refreshFriendGroups();
                break;
            case "KickedFromGroup":
                console.log("❌ You were kicked from the group:", notification.payload.groupId);
                if (typeof notification.payload === 'object' && notification.payload !== null && 'groupId' in notification.payload) {
                    const groupId = notification.payload.groupId;        
                    this.refreshFriendGroups();
                    if (window.location.pathname.includes(`/main/group/${groupId}`)) {
                        window.location.href = "/main";
                    }
                }
                break;
        }
    };

    handleReceiveMessage = (message: Message) => {
        runInAction(() => {
            const currentMessages = this.messages.get(message.channelId) || [];
            this.messages.set(message.channelId, [...currentMessages, message]);
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
    handleReceiveGroupMessage = (message: GroupMessage) => {
        const key = message.groupId;
        runInAction(() => {
            console.log("message received");
            const currentMessages = this.groupMessages.get(key) || [];
            this.groupMessages.set(key, [...currentMessages, message]);
        });
    };

    markMessagesAsRead = async (type: 'private' | 'group', id: string) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id;
    
        if (!userId) {
            console.error("User ID not found");
            return;
        }
    
        try {
            let dto: MarkAsReadDto;
            
            if (type === 'private') {
                dto = {
                    userId: userId,
                    friendId: id, 
                    groupId: undefined 
                };
            } else {
                dto = {
                    userId: userId,
                    groupId: id,
                    friendId: undefined 
                };
            }
    
            console.log("Sending DTO:", JSON.stringify(dto, null, 2));
            
            if (type === 'private') {
                await agent.Messages.MarkPrivateMessagesAsRead(dto);
                runInAction(() => {
                    this.unreadPrivateMessages.set(id, 0);
                });
            } else {
                await agent.Messages.MarkGroupMessagesAsRead(dto);
                runInAction(() => {
                    this.unreadGroupMessages.set(id, 0);
                });
            }
        } catch (error) {
            console.error(`Error marking ${type} messages as read:`, error);
        }
    };
    clearMessages = () => {
        this.messages.clear();
    };
}
