import { makeAutoObservable, runInAction } from "mobx";
import SignalRStore from "./SignalRStore";

export default class CallStore {
    private signalRStore: SignalRStore;
    public currentCall: {
        groupId: string;
        participants: Map<string, RTCPeerConnection>;
    } | null = null;
    public localStream: MediaStream | null = null;
    public remoteStreams: Map<string, MediaStream> = new Map();

    constructor(signalrStore: SignalRStore) {
        makeAutoObservable(this);
        this.signalRStore = signalrStore;

        if (!this.signalRStore.connection) {
            console.error("SignalR connection is not initialized");
            return;
        }

        console.log("[CallStore] Initializing WebRTC handlers");

        this.signalRStore.connection.on("webrtc-offer", this.handleOffer);
        this.signalRStore.connection.on("webrtc-answer", this.handleAnswer);
        this.signalRStore.connection.on("webrtc-ice-candidate", this.handleIceCandidate);
    }

    public async initLocalStream(): Promise<MediaStream> {
        if (!this.localStream) {
            console.log("[CallStore] Initializing local media stream");
            const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            runInAction(() => {
                this.localStream = stream;
            });
            console.log("[CallStore] Local stream obtained", this.localStream);
        }
        if (!this.localStream) {
            throw new Error("[CallStore] Failed to obtain local media stream");
        }
        return this.localStream;
    }

    public async joinCall(groupId: string, participantIds: string[]): Promise<void> {
        console.log(`[CallStore] Joining group call ${groupId} with participants:`, participantIds);

        if (this.currentCall) {
            console.error("Already in a group call");
            return;
        }

        const participants = new Map<string, RTCPeerConnection>();

        for (const participantId of participantIds) {
            console.log(`[CallStore] Creating peer connection to ${participantId}`);
            const peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    // Add TURN servers here if needed
                ]
            });


            this.localStream?.getTracks().forEach(track => {
                console.log(`[CallStore] Adding local track to ${participantId}:`, track);
                peerConnection.addTrack(track, this.localStream!);
            });
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log(`[CallStore] Sending ICE candidate to ${participantId}:`, event.candidate);
                    if (this.signalRStore.connection) {
                        this.signalRStore.connection.invoke("WebRtcIceCandidate", user.id,
                            participantId,
                            event.candidate,
                            groupId,
                        ).catch(console.error);
                    } else {
                        console.error("SignalR connection is not initialized");
                    }
                }
            };

            peerConnection.ontrack = (event) => {
                console.log(`Received ${event.track.kind} track from ${from}`, event.streams);
                runInAction(() => {
                this.remoteStreams.set(participantId, event.streams[0]);
                });
            };

            const offer = await peerConnection.createOffer();
            console.log(`[CallStore] Created offer for ${participantId}`, offer);

            await peerConnection.setLocalDescription(offer);
            console.log(`[CallStore] Set local description for ${participantId}`);
            console.log(`My user ID: ${user.id}`);
            const plainOffer = { type: offer.type, sdp: offer.sdp };
            if (this.signalRStore.connection) {
                this.signalRStore.connection.invoke("WebRtcOffer", user.id,
                    participantId,
                    plainOffer,
                    groupId,
                );
                console.log(`[CallStore] Sent offer to ${participantId}`);
            }

            participants.set(participantId, peerConnection);
        }

        runInAction(() => {
            this.currentCall = { groupId, participants };
        });

        console.log("[CallStore] Group call joined successfully");
    }

    private handleOffer = async ({ from, offer, groupId }: any) => {
        console.log(`[CallStore] Received offer from ${from} in group ${groupId}`, offer);

        if (!this.currentCall) {
            this.currentCall = {
                groupId,
                participants: new Map<string, RTCPeerConnection>(),
            };
        }

        const peerConnection = new RTCPeerConnection();

        this.localStream?.getTracks().forEach(track => {
            console.log(`[CallStore] Adding local track to ${from}:`, track);
            peerConnection.addTrack(track, this.localStream!);
        });
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`[CallStore] Sending ICE candidate back to ${from}`, event.candidate);
                if (this.signalRStore.connection) {
                    this.signalRStore.connection.invoke("WebRtcIceCandidate", user.id,
                        from,
                        event.candidate,
                        groupId,
                    );
                }
            }
        };

        peerConnection.ontrack = (event) => {
            console.log(`[CallStore] Received remote track from ${from}`, event.streams[0]);
            this.remoteStreams.set(from, event.streams[0]);
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        console.log(`[CallStore] Set remote description from ${from}`);

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log(`[CallStore] Created and set local answer for ${from}`, answer);
        const plainAnswer = { type: answer.type, sdp: answer.sdp };
        if (this.signalRStore.connection) {
            this.signalRStore.connection.invoke("WebRtcAnswer", user.id,
                from,
                plainAnswer,
                groupId,
            );
            console.log(`[CallStore] Sent answer to ${from}`);
        }

        this.currentCall.participants.set(from, peerConnection);
    };

    private handleAnswer = async ({ from, answer }: any) => {
        console.log(`[CallStore] Received answer from ${from}`, answer);
        const peerConnection = this.currentCall?.participants.get(from);
        if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log(`[CallStore] Set remote description from ${from}`);
        } else {
            console.warn(`[CallStore] No peer connection found for ${from}`);
        }
    };

    private handleIceCandidate = async ({ from, candidate, groupId }: any) => {
        console.log(`[CallStore] Received ICE candidate from ${from} groupId`, candidate, groupId);
        const peerConnection = this.currentCall?.participants.get(from);
        if (peerConnection && candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log(`[CallStore] Added ICE candidate from ${from}`);
        } else {
            console.warn(`[CallStore] No peer connection or invalid candidate from ${from}`);
        }
    };

    public async leaveCall() {
        console.log("[CallStore] Leaving call");
        if (!this.currentCall) return;

        this.currentCall.participants.forEach((pc, id) => {
            console.log(`[CallStore] Closing connection with ${id}`);
            pc.close();
        });

        runInAction(() => {
            this.currentCall = null;
        });

        console.log("[CallStore] Left the call successfully");
    }
}
