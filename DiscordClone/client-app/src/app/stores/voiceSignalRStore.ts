import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { makeAutoObservable, runInAction } from "mobx";
import { VoiceUserDto } from "../Models/VoiceUserDto";
import { ChannelStateDto } from "../Models/ChannelStateDto";
import { CallUserDto } from "../Models/CallUserDto";

const RTC_CONFIGURATION: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default class VoiceSignalRStore {
    connection: HubConnection | null = null;
    isConnected = false;
    isConnecting = false;

    localStream: MediaStream | null = null;
    remoteAudioContainerRef: HTMLDivElement | null = null;

    currentCallInfo: { callerId: string; targetId: string; isInitiator: boolean } | null = null;
    isInCall: boolean = false;
    oneToOnePeerConnection: RTCPeerConnection | null = null;
    oneToOneIceCandidateBuffer: RTCIceCandidateInit[] = [];
    isRinging: boolean = false;

    currentVoiceChannelId: string | null = null;
    usersInCurrentChannel: Map<string, VoiceUserDto> = new Map();
    peerConnectionsForChannel: Map<string, RTCPeerConnection> = new Map();
    localUserVoiceState: VoiceUserDto | null = null;

    isSpeakerGloballyMuted: boolean = false;

    private activeAudioElements = new Map<string, HTMLAudioElement>();
    private pendingStreamsToAttach: Array<{ id: string, stream: MediaStream, username?: string }> = [];

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
        this.initializeConnection();
    }

    private initializeConnection() {
        if (typeof window !== 'undefined' && localStorage.getItem('token')) {
            this.startConnection();
        }
    }

    async startConnection() {
        if (this.connection && this.isConnected) return;
        if (this.isConnecting) return;
        this.isConnecting = true;

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.warn("VoiceSignalRStore: No token for connection.");
                this.isConnecting = false;
                return;
            }

            this.connection = new HubConnectionBuilder()
                .withUrl("http://localhost:5000/VoiceHub", { accessTokenFactory: () => token || "" })
                .withAutomaticReconnect({
                    nextRetryDelayInMilliseconds: retryContext => {
                        if (retryContext.previousRetryCount > 10) {
                            console.warn(`SignalR VoiceHub: Max reconnect attempts. Error: ${retryContext.retryReason?.message}`);
                            return null;
                        }
                        const delay = Math.min(Math.pow(2, retryContext.previousRetryCount) * 1000, 30000);
                        console.log(`SignalR VoiceHub: Reconnect attempt ${retryContext.previousRetryCount + 1} in ${delay / 1000}s.`);
                        return delay;
                    }
                })
                .configureLogging(LogLevel.Information) // Or LogLevel.Warning for less noise
                .build();

            this.registerHubEventHandlers();
            this.setupConnectionEvents();

            await this.connection.start();

            if (this.connection.state === "Connected") {
                await this.postConnectionSetup();
                runInAction(() => {
                    this.isConnected = true;
                    this.isConnecting = false;
                    console.log("SignalR VoiceHub connection established.");
                });
            } else {
                console.error("SignalR VoiceHub connected but state is not 'Connected':", this.connection.state);
                runInAction(() => this.isConnecting = false);
            }
        } catch (error) {
            console.error("SignalR VoiceHub connection failed during start:", error);
            runInAction(() => this.isConnecting = false);
        }
    }

    async stopConnection() {
        try {
            if (this.currentVoiceChannelId) await this.leaveVoiceChannel();
            if (this.isInCall && this.currentCallInfo) await this.endCall();
            if (this.connection) await this.connection.stop();
        } catch (error) {
            console.error("Error stopping SignalR VoiceHub connection:", error);
        }
        this.cleanupFullConnectionState();
    }

    private cleanupFullConnectionState() {
        runInAction(() => {
            this.connection = null;
            this.isConnected = false;
            this.isConnecting = false;
            this.clearAllVoiceStates();
        });
    }

    private clearAllVoiceStates() {
        this.releaseLocalStream();
        this.cleanupOneToOneCallResources();
        this.currentCallInfo = null;
        this.isInCall = false;
        this.isRinging = false;
        this.cleanupAllChannelPeerConnections();
        this.currentVoiceChannelId = null;
        this.usersInCurrentChannel.clear();
        this.localUserVoiceState = null;
        runInAction(() => {
            this.activeAudioElements.forEach(el => el.remove());
            this.activeAudioElements.clear();
            this.pendingStreamsToAttach = [];
        });
        console.log("All voice states cleared.");
    }

    private async ensureLocalStream(): Promise<MediaStream | null> {
        if (this.localStream && this.localStream.active) {
            this.localStream.getAudioTracks().forEach(track => track.enabled = !(this.localUserVoiceState?.isMuted ?? false));
            return this.localStream;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            runInAction(() => {
                this.localStream = stream;
                this.localStream.getAudioTracks().forEach(track => track.enabled = !(this.localUserVoiceState?.isMuted ?? false));
            });
            return this.localStream;
        } catch (error) {
            console.error("Error acquiring local stream:", error);
            return null;
        }
    }


    private releaseLocalStream() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
    }

    private releaseLocalStreamIfUnused() {
        if (!this.isInCall && !this.currentVoiceChannelId) {
            this.releaseLocalStream();
        }
    }

    private async postConnectionSetup() {
        const userItem = localStorage.getItem("user");
        if (userItem && this.connection && this.connection.state === "Connected") {
            try {
                const user = JSON.parse(userItem);
                if (user.id && this.currentVoiceChannelId && !this.localUserVoiceState) {
                    runInAction(() => {
                        this.localUserVoiceState = {
                            id: user.id, username: user.userName || "User",
                            isMuted: false, isDeafened: false
                        };
                    });
                }
            } catch (error) {
                console.error("Error in postConnectionSetup:", error);
            }
        }
    }

    private setupConnectionEvents() {
        if (!this.connection) return;
        this.connection.onreconnecting(error => {
            this.isConnected = false;
            console.warn("SignalR VoiceHub reconnecting...", error?.message);
        });
        this.connection.onreconnected(async (connectionId?: string) => {
            this.isConnected = true;
            console.log("SignalR VoiceHub reconnected. ID:", connectionId);
            await this.postConnectionSetup();
            if (this.currentVoiceChannelId && this.localUserVoiceState) {
                const { currentVoiceChannelId: channelIdToRejoin, localUserVoiceState: { username: usernameToRejoin } } = this;
                this.cleanupAllChannelPeerConnections();
                runInAction(() => { this.currentVoiceChannelId = null; this.usersInCurrentChannel.clear(); });
                await this.joinVoiceChannel(channelIdToRejoin, usernameToRejoin);
            }
        });
        this.connection.onclose(error => {
            console.warn("SignalR VoiceHub connection closed.", error?.message);
            this.cleanupFullConnectionState();
        });
    }

    private registerHubEventHandlers() {
        if (!this.connection) return;
        this.connection.on("ReceiveCall", this.handleReceiveCall);
        this.connection.on("CallAccepted", this.handleCallAcceptedOneToOne);
        this.connection.on("CallDeclined", this.handleCallDeclinedOneToOne);
        this.connection.on("CallEnded", this.handleCallEndedOneToOne);
        this.connection.on("ReceiveSDP", this.handleReceiveSDPOneToOne);
        this.connection.on("ReceiveIceCandidate", this.handleReceiveIceCandidateOneToOne);
        this.connection.on("CallUserFailed", (targetId, reason) => {
            console.error(`Call to ${targetId} failed: ${reason}`);
            if (this.currentCallInfo?.targetId === targetId) {
                this.cleanupOneToOneCallResources();
                runInAction(() => { this.isRinging = false; this.isInCall = false; this.currentCallInfo = null; });
            }
        });
        this.connection.on("ChannelState", this.handleChannelState);
        this.connection.on("UserJoinedChannel", this.handleUserJoinedChannel);
        this.connection.on("UserLeftChannel", this.handleUserLeftChannel);
        this.connection.on("ReceiveChannelOffer", this.handleReceiveChannelOffer);
        this.connection.on("ReceiveChannelAnswer", this.handleReceiveChannelAnswer);
        this.connection.on("ReceiveChannelIceCandidate", this.handleReceiveChannelIceCandidate);
        this.connection.on("UserVoiceStateChanged", this.handleUserVoiceStateChanged);
    }

    setRemoteAudioContainer(element: HTMLDivElement | null) {
        if (this.remoteAudioContainerRef === element) return;
        this.remoteAudioContainerRef = element;
        if (this.remoteAudioContainerRef) this.processPendingStreams();
        else console.warn("Global remote audio container was set to null.");
    }

    private processPendingStreams() {
        if (!this.remoteAudioContainerRef) return;
        this.pendingStreamsToAttach.forEach(({ id, stream, username }) => {
            if (!this.activeAudioElements.has(id) || !this.activeAudioElements.get(id)?.parentElement) {
                this._attachStreamToContainer(id, stream, username);
            }
        });
        this.pendingStreamsToAttach = [];
    }

    addRemoteStream(id: string, stream: MediaStream, username?: string) {
        const existingAudioEl = this.activeAudioElements.get(id);
        if (existingAudioEl) {
            if (existingAudioEl.srcObject !== stream) {
                existingAudioEl.srcObject = stream;
                existingAudioEl.play().catch(e => console.error(`Error re-playing audio for ${id}:`, e));
            }
            if (this.remoteAudioContainerRef && !existingAudioEl.parentElement) {
                this.remoteAudioContainerRef.appendChild(existingAudioEl);
            }
            return;
        }
        if (this.remoteAudioContainerRef) this._attachStreamToContainer(id, stream, username);
        else {
            this.pendingStreamsToAttach = this.pendingStreamsToAttach.filter(p => p.id !== id);
            this.pendingStreamsToAttach.push({ id, stream, username });
        }
    }

    private _attachStreamToContainer(id: string, stream: MediaStream, username?: string) {
        if (!this.remoteAudioContainerRef) {
            console.error(`_attachStreamToContainer for '${id}' but remoteAudioContainerRef is null.`);
            if (!this.pendingStreamsToAttach.find(p => p.id === id)) {
                this.pendingStreamsToAttach.push({ id, stream, username });
            }
            return;
        }
        const audioEl = document.createElement('audio');
        audioEl.id = `remote-audio-${id}`;
        audioEl.srcObject = stream;
        audioEl.autoplay = true;
        audioEl.muted = this.isSpeakerGloballyMuted;
        this.remoteAudioContainerRef.appendChild(audioEl);
        this.activeAudioElements.set(id, audioEl);
        audioEl.play().catch(e => console.error(`Error playing audio for ID '${id}':`, e));
    }

    removeRemoteStream(id: string) {
        const audioEl = this.activeAudioElements.get(id);
        if (audioEl) {
            audioEl.remove();
            this.activeAudioElements.delete(id);
        }
        this.pendingStreamsToAttach = this.pendingStreamsToAttach.filter(p => p.id !== id);
    }

    private getOneToOneStreamId(remoteUserId: string): string {
        return `one-on-one-${remoteUserId}`;
    }

    private async createOneToOnePeerConnection(remoteUserId: string): Promise<RTCPeerConnection | null> {
        if (this.oneToOnePeerConnection && this.oneToOnePeerConnection.signalingState !== "closed") {
            this.oneToOnePeerConnection.close();
            this.oneToOnePeerConnection = null;
        }
        const pc = new RTCPeerConnection(RTC_CONFIGURATION);
        pc.onicecandidate = event => {
            if (event.candidate && this.connection) {
                this.connection.invoke("SendIceCandidate", remoteUserId, JSON.stringify(event.candidate))
                    .catch(err => console.error(`Error sending P2P ICE to ${remoteUserId}:`, err));
            }
        };
        pc.ontrack = event => {
            const stream = event.streams && event.streams[0];
            if (stream && event.track.kind === 'audio') {
                this.addRemoteStream(this.getOneToOneStreamId(remoteUserId), stream);
            }
        };
        pc.oniceconnectionstatechange = () => {
            console.log(`P2P ICE State for ${remoteUserId}: ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === "failed") console.error(`P2P ICE Connection FAILED for ${remoteUserId}.`);
        };
        pc.onsignalingstatechange = () => console.log(`P2P Signaling State for ${remoteUserId}: ${pc.signalingState}`);

        const localStream = await this.ensureLocalStream();
        if (localStream) localStream.getAudioTracks().forEach(track => pc.addTrack(track, localStream));
        else { console.error(`No local stream for P2P with ${remoteUserId}.`); pc.close(); return null; }
        this.oneToOnePeerConnection = pc;
        return pc;
    }

    private getLocalUserId(): string | null {
        const userItem = localStorage.getItem("user");
        if (userItem) { try { const user = JSON.parse(userItem); return user?.id || null; } catch (e) { console.error("Error parsing user:", e); } }
        return null;
    }

    handleReceiveCall = (callUserDto: CallUserDto) => {
        if (!callUserDto?.callerId || !callUserDto.targetId) { console.error("Invalid CallUserDto received.", callUserDto); return; }
        const localUserId = this.getLocalUserId();
        if (callUserDto.targetId !== localUserId) { console.warn("Received call not for this user."); return; }
        if (this.isInCall || this.currentVoiceChannelId || this.isRinging) {
            console.warn(`User busy, declining call from ${callUserDto.callerId}.`);
            this.connection?.invoke("DeclineCall", callUserDto.callerId).catch(err => console.error("Error auto-declining busy call:", err));
            return;
        }
        runInAction(() => {
            this.currentCallInfo = { callerId: callUserDto.callerId, targetId: callUserDto.targetId, isInitiator: false };
            this.isRinging = true; this.isInCall = false;
            console.log(`Incoming call from ${callUserDto.callerId} SET. Ringing.`);
        });
    };

    handleCallAcceptedOneToOne = async (acceptingUserId: string) => {
        console.log(`Call accepted by ${acceptingUserId}.`);
        if (!this.currentCallInfo || !this.oneToOnePeerConnection) { console.error("Call accepted but missing context."); return; }
        runInAction(() => { this.isInCall = true; this.isRinging = false; });
    };

    handleCallDeclinedOneToOne = (decliningUserId: string) => {
        console.log(`Call declined by ${decliningUserId}.`);
        this.cleanupOneToOneCallResources();
        runInAction(() => { this.currentCallInfo = null; this.isRinging = false; this.isInCall = false; });
    };

    handleCallEndedOneToOne = (endingUserId: string) => {
        console.log(`Call ended by ${endingUserId}.`);
        this.cleanupOneToOneCallResources();
        runInAction(() => { this.currentCallInfo = null; this.isRinging = false; this.isInCall = false; });
    };

    private cleanupOneToOneCallResources() {
        if (this.oneToOnePeerConnection) { this.oneToOnePeerConnection.close(); this.oneToOnePeerConnection = null; }
        if (this.currentCallInfo) {
            const otherUserId = this.currentCallInfo.isInitiator ? this.currentCallInfo.targetId : this.currentCallInfo.callerId;
            this.removeRemoteStream(this.getOneToOneStreamId(otherUserId));
        }
        this.oneToOneIceCandidateBuffer = [];
        this.releaseLocalStreamIfUnused();
    }

    async makeCall(targetId: string) {
        if (!this.connection || this.isInCall || this.currentVoiceChannelId) { console.error("Cannot make call: State invalid."); return; }
        const callerId = this.getLocalUserId();
        if (!callerId) { console.error("Cannot make call: Caller ID missing."); return; }
        runInAction(() => { this.currentCallInfo = { callerId, targetId, isInitiator: true }; this.isRinging = true; });
        const pc = await this.createOneToOnePeerConnection(targetId);
        if (!pc) return;
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await this.connection.invoke("CallUser", { callerId, targetId } as CallUserDto);
            await this.connection.invoke("SendSDP", targetId, JSON.stringify(offer));
        } catch (error) {
            console.error("Error making call:", error);
            this.cleanupOneToOneCallResources(); this.currentCallInfo = null;
        }
    }

    async acceptCall() {
        if (!this.connection || !this.currentCallInfo || this.currentCallInfo.isInitiator) { console.error("Cannot accept call: State invalid."); return; }
        const { callerId } = this.currentCallInfo;
        const pc = this.oneToOnePeerConnection;
        if (!pc) { console.error("Cannot accept call: Peer connection missing."); return; }
        if (pc.remoteDescription && pc.remoteDescription.type === 'offer') {
            try {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await this.connection.invoke("SendSDP", callerId, JSON.stringify(answer));
                await this.connection.invoke("AcceptCall", callerId);
                runInAction(() => { this.isInCall = true; this.isRinging = false; });
            } catch (error) {
                console.error("Error accepting call/sending answer:", error);
                this.cleanupOneToOneCallResources();
            }
        } else {
            console.warn("Cannot accept call: Offer not processed or invalid remoteDescription.", { remoteDesc: pc.remoteDescription });
        }
    }

    async declineCall() {
        if (!this.connection || !this.currentCallInfo || this.currentCallInfo.isInitiator) { console.error("Cannot decline: No incoming call."); return; }
        const { callerId } = this.currentCallInfo;
        try { await this.connection.invoke("DeclineCall", callerId); }
        catch (error) { console.error("Error declining call:", error); }
        finally { this.cleanupOneToOneCallResources(); runInAction(() => { this.currentCallInfo = null; this.isRinging = false; }); }
    }

    async endCall() {
        if (!this.connection || !this.isInCall || !this.currentCallInfo) { console.error("Cannot end call: Not in a call."); return; }
        const otherUserId = this.currentCallInfo.isInitiator ? this.currentCallInfo.targetId : this.currentCallInfo.callerId;
        try { await this.connection.invoke("EndCall", otherUserId); }
        catch (error) { console.error("Error ending call:", error); }
        finally { this.cleanupOneToOneCallResources(); runInAction(() => { this.currentCallInfo = null; this.isInCall = false; }); }
    }

    handleReceiveSDPOneToOne = async (senderUserId: string, sdpString: string) => {
        const sdp = JSON.parse(sdpString) as RTCSessionDescriptionInit;
        if (sdp.type === "offer") {
            if (!this.currentCallInfo || this.currentCallInfo.callerId !== senderUserId) {
                console.warn(`Offer from ${senderUserId} mismatched with current call caller ${this.currentCallInfo?.callerId}. Ignoring.`); return;
            }
            let pc = this.oneToOnePeerConnection;
            if (!pc || pc.signalingState === "closed") pc = await this.createOneToOnePeerConnection(senderUserId);
            if (!pc) { console.error(`Failed to get/create PC for offer from ${senderUserId}.`); return; }
            try {
                if (pc.signalingState !== "have-remote-offer") await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                else console.log(`Offer from ${senderUserId} already set or PC state not suitable. Not re-setting.`);
                if (pc.remoteDescription) while (this.oneToOneIceCandidateBuffer.length > 0) {
                    const c = this.oneToOneIceCandidateBuffer.shift(); if (c) try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { console.error(`Error adding buffered ICE for offer from ${senderUserId}:`, e); }
                }
                runInAction(() => { this.isRinging = true; });
            } catch (e) { console.error(`Error processing offer from ${senderUserId}:`, e); }
        } else if (sdp.type === "answer") {
            if (!this.currentCallInfo || this.currentCallInfo.targetId !== senderUserId) {
                console.warn(`Answer from ${senderUserId} mismatched with current call target ${this.currentCallInfo?.targetId}. Ignoring.`); return;
            }
            const pc = this.oneToOnePeerConnection;
            if (!pc || pc.signalingState === "closed") { console.error(`Initiator PC null/closed for answer from ${senderUserId}.`); return; }
            try {
                if (pc.signalingState === "have-local-offer" || !pc.remoteDescription) {
                    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                    runInAction(() => { this.isInCall = true; this.isRinging = false; });
                } else console.warn(`PC state not suitable for answer from ${senderUserId}. State: ${pc.signalingState}.`);
                if (pc.remoteDescription) while (this.oneToOneIceCandidateBuffer.length > 0) {
                    const c = this.oneToOneIceCandidateBuffer.shift(); if (c) try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { console.error(`Error adding buffered ICE for answer from ${senderUserId}:`, e); }
                }
            } catch (e) { console.error(`Error processing answer from ${senderUserId}:`, e); }
        } else console.warn(`Unknown SDP type: '${sdp.type}' from ${senderUserId}.`);
    };

    handleReceiveIceCandidateOneToOne = async (senderUserId: string, candidateString: string) => {
        if (!this.currentCallInfo || (this.currentCallInfo.isInitiator && this.currentCallInfo.targetId !== senderUserId) || (!this.currentCallInfo.isInitiator && this.currentCallInfo.callerId !== senderUserId)) {
            console.warn(`P2P ICE for mismatched call. Expected from: ${this.currentCallInfo?.isInitiator ? this.currentCallInfo.targetId : this.currentCallInfo?.callerId}. Actual: ${senderUserId}. Ignoring.`); return;
        }
        const candidate = JSON.parse(candidateString) as RTCIceCandidateInit;
        if (this.oneToOnePeerConnection && (this.oneToOnePeerConnection.remoteDescription || this.oneToOnePeerConnection.currentRemoteDescription)) { // currentRemoteDescription for older browsers
            try { await this.oneToOnePeerConnection.addIceCandidate(new RTCIceCandidate(candidate)); }
            catch (error) { console.error(`Error adding P2P ICE from ${senderUserId}:`, error); }
        } else {
            this.oneToOneIceCandidateBuffer.push(candidate);
        }
    };

    // --- KANAŁY GŁOSOWE ---
    private async createPeerConnectionForChannelUser(remoteUserId: string, remoteUsername: string, isOfferer: boolean): Promise<RTCPeerConnection | null> {
        if (this.peerConnectionsForChannel.has(remoteUserId)) return this.peerConnectionsForChannel.get(remoteUserId) || null;
        const pc = new RTCPeerConnection(RTC_CONFIGURATION);
        this.peerConnectionsForChannel.set(remoteUserId, pc);
        pc.onicecandidate = event => {
            if (event.candidate && this.connection) this.connection.invoke("SendChannelIceCandidate", remoteUserId, JSON.stringify(event.candidate)).catch(err => console.error(`Error sending channel ICE to ${remoteUserId}:`, err));
        };
        pc.ontrack = event => { if (event.streams[0]) this.addRemoteStream(remoteUserId, event.streams[0], remoteUsername); };
        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "closed") this.cleanupChannelPeerConnection(remoteUserId);
        };
        const localStream = await this.ensureLocalStream();
        if (localStream) localStream.getAudioTracks().forEach(track => pc.addTrack(track, localStream));
        else { this.cleanupChannelPeerConnection(remoteUserId); return null; }
        if (isOfferer && this.connection) {
            try {
                const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
                await this.connection.invoke("SendChannelOffer", remoteUserId, JSON.stringify(offer));
            } catch (error) { console.error(`Error creating/sending channel offer to ${remoteUserId}:`, error); }
        }
        return pc;
    }

    private cleanupChannelPeerConnection(remoteUserId: string) {
        const pc = this.peerConnectionsForChannel.get(remoteUserId);
        if (pc) { pc.close(); this.peerConnectionsForChannel.delete(remoteUserId); }
        this.removeRemoteStream(remoteUserId);
    }

    private cleanupAllChannelPeerConnections() {
        this.peerConnectionsForChannel.forEach((pc, userId) => { pc.close(); this.removeRemoteStream(userId); });
        this.peerConnectionsForChannel.clear();
    }

    async joinVoiceChannel(channelId: string, username: string) {
        if (!this.connection || this.isInCall) { console.error("Cannot join channel: Invalid state."); return; }
        if (this.currentVoiceChannelId === channelId) { console.warn("Already in this channel."); return; }
        if (this.currentVoiceChannelId) await this.leaveVoiceChannel();
        await this.ensureLocalStream();
        const localUser = JSON.parse(localStorage.getItem("user") || "{}");
        runInAction(() => {
            this.currentVoiceChannelId = channelId;
            this.localUserVoiceState = { id: localUser.id || 'unknown', username, isMuted: this.localUserVoiceState?.isMuted || false, isDeafened: this.localUserVoiceState?.isDeafened || false, image: localUser.image || null };
        });
        try { await this.connection.invoke("JoinVoiceChannel", channelId, username); }
        catch (error) { console.error(`Error joining channel ${channelId}:`, error); runInAction(() => { this.currentVoiceChannelId = null; this.localUserVoiceState = null; }); }
    }

    async leaveVoiceChannel() {
        if (!this.connection || !this.currentVoiceChannelId) { console.warn("Not in a channel to leave."); return; }
        const channelId = this.currentVoiceChannelId;
        try { await this.connection.invoke("LeaveVoiceChannel"); }
        catch (error) { console.error(`Error leaving channel ${channelId}:`, error); }
        finally {
            this.cleanupAllChannelPeerConnections();
            runInAction(() => { this.currentVoiceChannelId = null; this.usersInCurrentChannel.clear(); this.localUserVoiceState = null; });
            this.releaseLocalStreamIfUnused();
        }
    }

    handleChannelState = (channelState: ChannelStateDto) => {
        const localUserId = this.getLocalUserId();
        if (!localUserId) { console.error("handleChannelState: localUserId missing."); return; }
        this.usersInCurrentChannel.clear();
        if (channelState?.users) channelState.users.forEach(existingUser => {
            if (existingUser.id === localUserId) return;
            this.usersInCurrentChannel.set(existingUser.id, existingUser);
            this.createPeerConnectionForChannelUser(existingUser.id, existingUser.username || 'User', false);
        });
    };

    handleUserJoinedChannel = (channelId: string, newUserDto: VoiceUserDto) => {
        const localUserId = this.getLocalUserId();
        if (!localUserId || this.currentVoiceChannelId !== channelId || newUserDto.id === localUserId) return;
        if (!this.usersInCurrentChannel.has(newUserDto.id)) this.usersInCurrentChannel.set(newUserDto.id, newUserDto);
        this.createPeerConnectionForChannelUser(newUserDto.id, newUserDto.username || 'User', true);
    };

    handleUserLeftChannel = (channelId: string, userId: string, reason: string) => {
        if (this.currentVoiceChannelId !== channelId) return;
        this.cleanupChannelPeerConnection(userId);
        this.usersInCurrentChannel.delete(userId);
    };

    handleReceiveChannelOffer = async (senderUserId: string, channelId: string, offerSdpString: string) => {
        if (this.currentVoiceChannelId !== channelId) return;
        const senderUserDto = this.usersInCurrentChannel.get(senderUserId);
        if (!senderUserDto) { console.warn(`Channel offer from unknown user ${senderUserId}`); return; }
        let pc = this.peerConnectionsForChannel.get(senderUserId);
        if (!pc) pc = await this.createPeerConnectionForChannelUser(senderUserId, senderUserDto.username, false);
        if (!pc) return;
        try {
            const offerSdp = JSON.parse(offerSdpString) as RTCSessionDescriptionInit;
            await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
            const answerSdp = await pc.createAnswer(); await pc.setLocalDescription(answerSdp);
            if (this.connection) await this.connection.invoke("SendChannelAnswer", senderUserId, JSON.stringify(answerSdp));
        } catch (error) { console.error(`Error handling channel offer from ${senderUserId}:`, error); }
    };

    handleReceiveChannelAnswer = async (senderUserId: string, channelId: string, answerSdpString: string) => {
        if (this.currentVoiceChannelId !== channelId) return;
        const pc = this.peerConnectionsForChannel.get(senderUserId);
        if (!pc) { console.warn(`Channel answer from ${senderUserId} but no PC.`); return; }
        try {
            const answerSdp = JSON.parse(answerSdpString) as RTCSessionDescriptionInit;
            await pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
        } catch (error) { console.error(`Error handling channel answer from ${senderUserId}:`, error); }
    };

    handleReceiveChannelIceCandidate = async (senderUserId: string, channelId: string, candidateString: string) => {
        if (this.currentVoiceChannelId !== channelId) return;
        const pc = this.peerConnectionsForChannel.get(senderUserId);
        if (!pc) { console.warn(`Channel ICE from ${senderUserId} but no PC.`); return; }
        try {
            const candidate = JSON.parse(candidateString) as RTCIceCandidateInit;
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) { if (!error.message.includes("setRemoteDescription")) console.error(`Error adding channel ICE from ${senderUserId}:`, error); }
    };

    handleUserVoiceStateChanged = (channelId: string, userDto: VoiceUserDto) => {
        if (this.currentVoiceChannelId !== channelId) return;
        this.usersInCurrentChannel.set(userDto.id, userDto);
    };

    async toggleLocalMute() {
        if (this.localStream && this.isInCall) {
            const currentTrackState = this.localStream.getAudioTracks()[0]?.enabled ?? true;
            this.localStream.getAudioTracks().forEach(track => track.enabled = !currentTrackState);
            return;
        }
        if (!this.localUserVoiceState || !this.localStream || !this.connection || !this.currentVoiceChannelId) { console.warn("Cannot toggle channel mute: Invalid state."); return; }
        const newMuteState = !this.localUserVoiceState.isMuted;
        this.localUserVoiceState.isMuted = newMuteState;
        this.localStream.getAudioTracks().forEach(track => track.enabled = !newMuteState);
        try { await this.connection.invoke("UpdateUserVoiceStateInChannel", { ...this.localUserVoiceState }); }
        catch (error) {
            console.error("Error updating voice state on server:", error);
            this.localUserVoiceState.isMuted = !newMuteState;
            this.localStream.getAudioTracks().forEach(track => track.enabled = newMuteState);
        }
    }

    toggleGlobalSpeakerMute() {
        this.isSpeakerGloballyMuted = !this.isSpeakerGloballyMuted;
        this.activeAudioElements.forEach(audioEl => { audioEl.muted = this.isSpeakerGloballyMuted; });
    }
}