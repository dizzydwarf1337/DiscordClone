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

    constructor(signalRStore: SignalRStore) {
      makeAutoObservable(this);
      this.signalRStore = signalRStore;

      this.waitForConnectionAndBindHandlers();
    }

    private async waitForConnectionAndBindHandlers(retries = 10, delayMs = 500) {
      for (let attempt = 0; attempt < retries; attempt++) {
        if (this.signalRStore.connection) {
          this.signalRStore.connection.on("webrtc-offer", this.handleOffer);
          this.signalRStore.connection.on("webrtc-answer", this.handleAnswer);
          this.signalRStore.connection.on("webrtc-ice-candidate", this.handleIceCandidate);
          console.log("[CallStore] SignalR connection initialized and handlers bound");
          return;
        }
        await this.sleep(delayMs);
      }
      console.error("SignalR connection is not initialized after retries");
    }

    private sleep(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async initLocalStream(): Promise<MediaStream> {
        if (this.localStream) {
            return this.localStream;
        }

        try {
            console.log("[CallStore] Initializing local media stream");
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: false, 
                audio: true 
            });
            
            runInAction(() => {
                this.localStream = stream;
            });
            
            console.log("[CallStore] Local stream obtained", this.localStream);
            return this.localStream;
        } catch (error) {
            console.error("[CallStore] Failed to obtain local media stream", error);
            throw new Error("Failed to obtain local media stream");
        }
    }

    public async joinCall(groupId: string, participantIds: string[]) {
        if (this.currentCall) {
            console.error("Already in a call");
            return;
        }

        await this.initLocalStream(); // Ensure local stream is initialized
        const participants = new Map<string, RTCPeerConnection>();
        const user = JSON.parse(localStorage.getItem("user") || "{}");

        for (const participantId of participantIds) {
            if (participantId === user.id) continue; // Skip self

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });

            // Add local tracks
            this.localStream?.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream!);
            });

            pc.onicecandidate = (event) => {
                if (event.candidate && this.signalRStore.connection) {
                    this.signalRStore.connection.invoke("WebRtcIceCandidate",
                        user.id,
                        participantId,
                        {
                            candidate: event.candidate.candidate,
                            sdpMid: event.candidate.sdpMid,
                            sdpMLineIndex: event.candidate.sdpMLineIndex
                        },
                        groupId
                    ).catch(err => console.error("Error sending ICE candidate:", err));
                }
            };

            pc.ontrack = (event) => {
                runInAction(() => {
                    if (!this.remoteStreams.has(participantId)) {
                        this.remoteStreams.set(participantId, new MediaStream());
                    }
                    const remoteStream = this.remoteStreams.get(participantId)!;
                    event.streams[0].getTracks().forEach(track => {
                        if (!remoteStream.getTracks().some(t => t.id === track.id)) {
                            remoteStream.addTrack(track);
                        }
                    });
                });
            };

            try {
                const offer = await pc.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: false
                });
                await pc.setLocalDescription(offer);

                if (this.signalRStore.connection) {
                    await this.signalRStore.connection.invoke("WebRtcOffer",
                        user.id,
                        participantId,
                        { type: offer.type, sdp: offer.sdp },
                        groupId
                    );
                }

                participants.set(participantId, pc);
            } catch (error) {
                console.error("Error creating/sending offer:", error);
                pc.close();
            }
        }

        runInAction(() => {
            this.currentCall = { groupId, participants };
        });
    }

    private handleOffer = async ({ from, offer, groupId }: { from: string, offer: RTCSessionDescriptionInit, groupId: string }) => {
        console.log("Received offer from", from);
        if (!this.currentCall || this.currentCall.groupId !== groupId) {
            this.currentCall = {
                groupId,
                participants: new Map<string, RTCPeerConnection>(),
            };
        }

        // Skip if we already have a connection for this participant
        if (this.currentCall.participants.has(from)) {
            console.warn(`Already have a connection for ${from}`);
            return;
        }

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        try {
            // Add local tracks first
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    pc.addTrack(track, this.localStream!);
                });
            }

            // Set up event handlers
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            pc.onicecandidate = (event) => {
                if (event.candidate && this.signalRStore.connection) {
                    this.signalRStore.connection.invoke("WebRtcIceCandidate",
                        user.id,
                        from,
                        {
                            candidate: event.candidate.candidate,
                            sdpMid: event.candidate.sdpMid,
                            sdpMLineIndex: event.candidate.sdpMLineIndex
                        },
                        groupId
                    ).catch(console.error);
                }
            };

            pc.ontrack = (event) => {
                runInAction(() => {
                    if (!this.remoteStreams.has(from)) {
                        this.remoteStreams.set(from, new MediaStream());
                    }
                    const remoteStream = this.remoteStreams.get(from)!;
                    event.streams[0].getTracks().forEach(track => {
                        if (!remoteStream.getTracks().some(t => t.id === track.id)) {
                            remoteStream.addTrack(track);
                        }
                    });
                });
            };

            // Process the offer
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            if (this.signalRStore.connection) {
                await this.signalRStore.connection.invoke("WebRtcAnswer",
                    user.id,
                    from,
                    { type: answer.type, sdp: answer.sdp },
                    groupId
                );
            }

            runInAction(() => {
                this.currentCall?.participants.set(from, pc);
            });

        } catch (error) {
            console.error("Error handling offer:", error);
            pc.close();
        }
    };

    private handleAnswer = async ({ from, answer, groupId }: { from: string, answer: RTCSessionDescriptionInit, groupId: string }) => {
        console.log("Received answer from", from);
        const pc = this.currentCall?.participants.get(from);
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (error) {
                console.error("Error setting remote description:", error);
            }
        } else {
            console.warn(`No peer connection found for ${from}`);
        }
    };

    private handleIceCandidate = async ({ from, candidate, groupId }: { from: string, candidate: RTCIceCandidateInit, groupId: string }) => {
        if (!this.currentCall || this.currentCall.groupId !== groupId) return;

        const pc = this.currentCall.participants.get(from);
        if (pc && candidate) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error("Error adding ICE candidate:", e);
            }
        }
    };

    public async leaveCall() {
        console.log("[CallStore] Leaving call");
        if (!this.currentCall) return;

        // Close all peer connections
        this.currentCall.participants.forEach((pc, id) => {
            console.log(`[CallStore] Closing connection with ${id}`);
            pc.close();
        });

        // Stop all local tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }

        // Stop all remote tracks
        this.remoteStreams.forEach(stream => {
            stream.getTracks().forEach(track => track.stop());
        });

        runInAction(() => {
            this.currentCall = null;
            this.remoteStreams.clear();
            // Don't clear localStream as it might be reused
        });

        console.log("[CallStore] Left the call successfully");
    }
}