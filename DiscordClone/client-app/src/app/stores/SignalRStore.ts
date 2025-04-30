import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { action, makeAutoObservable, runInAction } from "mobx";
import Message from "../Models/message";
import agent from "../API/agent";
import PrivateMessage from "../Models/PrivateMessage";
import GroupMessage from "../Models/GroupMessage";
import { NotificationDto } from "../Models/NotificationDto";
import FriendStore from "./friendStore";
import { MarkAsReadDto } from "../Models/MarkAsReadDto";

const MAX_RETRY_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;

export default class SignalRStore {
    connection: HubConnection | null = null;
    messages = new Map<string, Message[]>();
    privateMessages = new Map<string, PrivateMessage[]>();
    groupMessages = new Map<string, GroupMessage[]>();
    currentChannel = "";
    currentServer = "";
    isConnected = false;
    isConnecting = false;
    retryCount = 0;
    friendStore: FriendStore;
    unreadPrivateMessages = new Map<string, number>();
    unreadGroupMessages = new Map<string, number>();

    constructor(friendStore: FriendStore) {
        makeAutoObservable(this);
        this.friendStore = friendStore;
        this.initializeConnection();
    }

    private initializeConnection() {
        if (typeof window !== 'undefined' && localStorage.getItem('user')) {
            this.startConnection();
        }
    }

    startConnection = async () => {
        if (this.connection || this.isConnecting) return;

        runInAction(() => {
            this.isConnecting = true;
            this.retryCount = 0;
        });

        try {
            this.connection = new HubConnectionBuilder()
                .withUrl("http://localhost:5000/ChatHub", {
                    accessTokenFactory: () => localStorage.getItem("token") || ""
                })
                .withAutomaticReconnect({
                    nextRetryDelayInMilliseconds: retryContext => {
                        if (retryContext.elapsedMilliseconds < 120000) { // 2 minutes
                            return Math.min(retryContext.previousRetryCount * 2000, 10000);
                        }
                        return 15000; // After 2 minutes, retry every 15 seconds
                    }
                })
                .configureLogging(LogLevel.Warning)
                .build();

            this.registerHubMethods();
            this.setupConnectionEvents();

            await this.connection.start();
            await this.postConnectionSetup();

            runInAction(() => {
                this.isConnected = true;
                this.retryCount = 0;
            });
        } catch (error) {
            console.error("Connection failed:", error);
            this.handleConnectionFailure();
        } finally {
            runInAction(() => {
                this.isConnecting = false;
            });
        }
    };

    private async postConnectionSetup() {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.id) {
            await Promise.all([
                this.connection?.invoke("SetUserId", user.id),
                this.initializeUnreadCounts(user.id), // Ensure this method is implemented below
                this.connectToUserChannels(user.id)
            ]);
        }
    }

    private setupConnectionEvents() {
        if (!this.connection) return;

        this.connection.onreconnecting(() => {
            runInAction(() => {
                this.isConnected = false;
                console.log("Attempting to reconnect...");
            });
        });

        this.connection.onreconnected(async () => {
            console.log("Connection restored");
            await this.reinitializeConnection();
        });

        this.connection.onclose(error => {
            runInAction(() => this.isConnected = false);
            if (error) {
                console.error("Connection closed:", error);
                this.handleConnectionFailure();
            }
        });
    }

    private async reinitializeConnection() {
        runInAction(() => this.isConnected = true);
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.id) {
            await this.connectToUserChannels(user.id);
            if (this.currentServer && this.currentChannel) {
                await this.joinChannel(this.currentServer, this.currentChannel);
            }
        }
    }

    private handleConnectionFailure() {
        if (this.retryCount < MAX_RETRY_ATTEMPTS) {
            runInAction(() => this.retryCount++);
            setTimeout(() => this.startConnection(), RECONNECT_DELAY);
        } else {
            console.error("Max reconnection attempts reached");
            this.stopConnection();
        }
    }

    private registerHubMethods() {
        if (!this.connection) return;

        this.connection.on("ReceiveMessage", this.handleReceiveMessage);
        this.connection.on("ReceivePrivateMessage", this.handleReceivePrivateMessage);
        this.connection.on("ReceiveGroupMessage", this.handleReceiveGroupMessage);
        this.connection.on("ReceiveNotification", this.handleReceiveNotification);
    }

    stopConnection = async () => {
        try {
            await this.connection?.stop();
            this.cleanupConnection();
            console.log("Connection stopped");
        } catch (error) {
            console.error("Error stopping connection:", error);
        }
    };

    private cleanupConnection() {
        runInAction(() => {
            this.connection = null;
            this.isConnected = false;
            this.isConnecting = false;
            this.retryCount = 0;
        });
    }

    joinChannel = async (serverName: string, channelName: string) => {
        if (!this.connection) {
            console.error("Connection not available");
            return;
        }

        try {
            const groupName = `${serverName}:${channelName}`;
            await this.connection.invoke("JoinChannel", groupName);
            runInAction(() => {
                this.currentServer = serverName;
                this.currentChannel = channelName;
            });
            console.log(`Joined ${channelName} on ${serverName}`);
        } catch (error) {
            console.error("Join channel failed:", error);
            setTimeout(() => this.joinChannel(serverName, channelName), 2000);
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

    private async initializeUnreadCounts(userId: string) {
        try {
            const [privateUnreadCounts, groupUnreadCounts] = await Promise.all([
                agent.Messages.GetUnreadPrivateMessageCounts(userId),
                agent.Messages.GetUnreadGroupMessageCounts(userId)
            ]);
            const unreadCounts = {
                privateMessages: privateUnreadCounts,
                groupMessages: groupUnreadCounts
            };
            
            runInAction(() => {
                this.unreadPrivateMessages = new Map(unreadCounts.privateMessages);
                this.unreadGroupMessages = new Map(unreadCounts.groupMessages);
            });
            console.log("Unread counts initialized");
        } catch (error) {
            console.error("Error initializing unread counts:", error);
        }
    }

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
