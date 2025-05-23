
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
    currentCall: { callerId: string; targetId: string } | null = null;
    isInCall: boolean = false;
    peerConnection: RTCPeerConnection | null = null;
    iceCandidateBuffer: RTCIceCandidate[] = [];
    localStream: MediaStream | null = null;
    remoteStream: MediaStream | null = null;
    isRinging: boolean = false;
    audioElement: HTMLAudioElement | null = null;
    refreshChannelMessages = 0;

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
                        if (retryContext.elapsedMilliseconds < 120000) {
                            return Math.min(retryContext.previousRetryCount * 2000, 10000);
                        }
                        return 15000;
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
                this.initializeUnreadCounts(user.id),
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
        this.connection.on("ReceiveCall", (callUserDto) => {
            console.log("ReceiveCall triggered:", callUserDto);
            runInAction(() => {
                this.currentCall = { callerId: callUserDto.callerId, targetId: callUserDto.targetId };
            });
            console.log("Updated currentCall:", this.currentCall);
        });
        this.connection.on("CallAccepted", (callerId) => {
            console.log("Call accepted by:", callerId);
            runInAction(() => {
                this.isInCall = true;
            });
        });

        this.connection.on("CallDeclined", (callerId) => {
            console.log("Call declined by:", callerId);
            runInAction(() => {
                this.currentCall = null;
                this.isRinging = false; 
            });
        });

        this.connection.on("CallEnded", (callerId) => {
            console.log("Call ended by:", callerId);
            if (this.currentCall) {
                runInAction(() => {
                    this.currentCall = null;
                    this.isInCall = false;
                    this.isRinging = false;
                });

                if (this.peerConnection) {
                    this.peerConnection.close();
                    this.peerConnection = null;
                }

                this.localStream?.getTracks().forEach((track) => track.stop());
                this.localStream = null;
                this.remoteStream = null;

                console.log("Call ended");
            } else {
                console.log("No active call to end.");
            }
        });

        this.connection.on("ReceiveSDP", this.handleReceiveSDP);
        this.connection.on("ReceiveIceCandidate", this.handleReceiveIceCandidate);
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

    refreshFriends = async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id;
        if (!userId) {
            console.error("User ID not found in local storage");
            return;
        }
        try {
            const friends = await agent.Friends.GetUserFriendsById(userId);
            runInAction(() => {
                this.friendStore.friends = friends;
            });
            console.log("Friend store refreshed with new friends");
        }
        catch (error) {
            console.error("Error refreshing friend store:", error);
        }
    };

    handleReceiveNotification = async (notification: NotificationDto) => {
        console.log("🔔 Notification received:", notification);
        switch (notification.type) {
            case "NewPrivateMessage":
                const privateMsg = notification.payload.messageDto;
                const key = [privateMsg.senderId, privateMsg.receiverId].sort().join("-");
                if (!window.location.pathname.includes(`/main/friend/${privateMsg.receiverId}`) && 
                !window.location.pathname.includes(`/main/friend/${privateMsg.senderId}`)) {
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
           case "ReceivedFriendRequest":
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                const friendRequests = await this.friendStore.GetUserFriendRequestsById(user.id);
                console.log("Friend requests:", friendRequests);
                runInAction(() => {
                    this.friendStore.setFriendsRequests(friendRequests);
                });
                break;
            case "FriendRequestAccepted":
                await this.refreshFriends();
                break;
            case "FriendRemoved":
                if (window.location.pathname.includes(`/main/friend/${notification.payload.removedId}`)
                     || window.location.pathname.includes(`/main/friend/${notification.payload.removedFriendId}`)) {
                    window.location.href = "/main";
                }
                await this.refreshFriends();
                break;
            case "ChannelMessageWithAttachment":
                this.refreshChannelMessages++;
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
                    let key = [userId, id].sort().join("-");
                    this.unreadPrivateMessages.set(key, 0);
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
    makeCall = async (targetId: string) => {
        if (!this.connection) {
            console.error("SignalR connection not established");
            return;
        }

        try {
            // Устанавливаем текущий звонок
            let user = localStorage.getItem("user");
            let callerId = JSON.parse(user || "{}").id;

            runInAction(() => {
                this.currentCall = { callerId, targetId };
                this.isRinging = true;
            });

            // Создаём peerConnection
            this.peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            });

            // Обработчик ICE кандидатов
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("ICE Candidate:", event.candidate);
                    this.connection?.invoke("SendIceCandidate", targetId, JSON.stringify(event.candidate));
                }
            };

            // Обработчик добавления удалённого потока
            this.peerConnection.ontrack = (event) => {
                console.log("ontrack triggered", event);
                if (!this.remoteStream) {
                    this.remoteStream = new MediaStream();
                }
                this.remoteStream.addTrack(event.track);
                console.log("Remote track added:", event.track);
                this.attachRemoteStreamToAudio();
            };

            // Запрашиваем доступ к микрофону
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("localStream tracks:", this.localStream.getTracks());

            // Добавляем треки в peerConnection
            this.localStream.getTracks().forEach((track) => {
                console.log("Adding local track:", track);
                this.peerConnection?.addTrack(track, this.localStream!);
            });

            // Создаём SDP offer
            const offer = await this.peerConnection.createOffer();
            console.log("SDP Offer:", offer);
            await this.peerConnection.setLocalDescription(offer);

            await this.connection.invoke("SendSDP", targetId, JSON.stringify(offer));
            console.log("SDP Offer sent", JSON.stringify(offer));

            // Отправляем запрос на звонок через SignalR
            await this.connection.invoke("CallUser", {
                CallerId: callerId,
                TargetId: targetId,
            });

            console.log("Call initiated");
        } catch (error) {
            console.error("Error making call:", error);
        }
    };

    acceptCall = async (callerId: string) => {
        if (!this.connection) {
            console.error("SignalR connection not established");
            return;
        }

        try {
            // Создаём peerConnection
            this.peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            });

            // Обработчик ICE кандидатов
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("ICE Candidate:", event.candidate);
                    this.connection?.invoke("SendIceCandidate", callerId, JSON.stringify(event.candidate));
                }
            };

            // Обработчик добавления удалённого потока
            this.peerConnection.ontrack = (event) => {
                console.log("ontrack triggered", event);
                if (!this.remoteStream) {
                    this.remoteStream = new MediaStream();
                }
                this.remoteStream.addTrack(event.track);
                console.log("Remote track added:", event.track);
                console.log("remoteStream tracks:", this.remoteStream.getTracks());
                this.attachRemoteStreamToAudio();
            };

            this.peerConnection.onconnectionstatechange = () => {
                console.log("ICE connection state:", this.peerConnection?.connectionState);
            };
            console.log("remoteStream audio tracks:", this.remoteStream?.getAudioTracks());

            // Запрашиваем доступ к микрофону
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("localStream tracks:", this.localStream.getTracks());

            // Добавляем треки в peerConnection
            this.localStream.getTracks().forEach((track) => {
                console.log("Adding local track:", track);
                this.peerConnection?.addTrack(track, this.localStream!);
            });

            // Отправляем SDP answer
            await this.connection.invoke("AcceptCall", callerId);

            runInAction(() => {
                this.isInCall = true;
                this.currentCall = null;
            });

            console.log("Call accepted");
        } catch (error) {
            console.error("Error accepting call:", error);
        }
    };


    declineCall = async (callerId: string) => {
        if (!this.connection) {
            console.error("SignalR connection not established");
            return;
        }

        try {
            await this.connection.invoke("DeclineCall", callerId);

            runInAction(() => {
                this.currentCall = null; 
                this.isRinging = false; 
            });

            console.log("Call declined");
        } catch (error) {
            console.error("Error declining call:", error);
        }
    };
    endCall = async (targetId: string) => {
        if (!this.connection) {
            console.error("SignalR connection not established");
            return;
        }

        try {
            await this.connection.invoke("EndCall", targetId);
            if (this.peerConnection) {
                this.peerConnection.close();
                this.peerConnection = null;
            }

            this.localStream?.getTracks().forEach((track) => track.stop());
            this.localStream = null;
            this.remoteStream = null;

            runInAction(() => {
                this.isInCall = false;
                this.currentCall = null;
            });

            console.log("Call ended");
        } catch (error) {
            console.error("Error ending call:", error);
        }
    };
    handleReceiveSDP = async (sdp: string) => {
        if (!this.peerConnection) {
            this.peerConnection = new RTCPeerConnection();

            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.connection?.invoke("SendIceCandidate", this.currentCall?.targetId || "", JSON.stringify(event.candidate));
                }
            };
            this.peerConnection.ontrack = (event) => {
                if (!this.remoteStream) {
                    this.remoteStream = new MediaStream();
                }
                this.remoteStream.addTrack(event.track);
                this.attachRemoteStreamToAudio();
                console.log("Remote track added:", event.track);
            };
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.localStream.getTracks().forEach((track) => {
                this.peerConnection?.addTrack(track, this.localStream!);
            });
        }

        const description = new RTCSessionDescription(JSON.parse(sdp));
        await this.peerConnection.setRemoteDescription(description);
        while (this.iceCandidateBuffer.length > 0) {
            const candidate = this.iceCandidateBuffer.shift();
            if (candidate) {
                await this.peerConnection.addIceCandidate(candidate);
            }
        }

        if (description.type === "offer") {
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            await this.connection?.invoke("SendSDP", this.currentCall?.callerId || "", JSON.stringify(answer));
        }
    };

    handleReceiveIceCandidate = async (candidate: string) => {
        const iceCandidate = new RTCIceCandidate(JSON.parse(candidate));

        if (this.peerConnection) {
            if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
                await this.peerConnection.addIceCandidate(iceCandidate);
            } else {
                this.iceCandidateBuffer.push(iceCandidate);
            }
        }
    };

    setAudioElement = (element: HTMLAudioElement) => {
        this.audioElement = element;
    }
    private attachRemoteStreamToAudio() {
        console.log("attachRemoteStreamToAudio called");
        console.log("Audio element:", this.audioElement);
        console.log("Remote stream:", this.remoteStream);

        if (this.audioElement && this.remoteStream) {
            this.audioElement.srcObject = this.remoteStream;
            this.audioElement.play().catch((error) => {
                console.error("Error playing audio:", error);
            });
        } else {
            console.error("Audio element or remote stream is not available");
        }
    }

}