export interface VoiceUserDto {
    id: string;
    username: string;
    image: string | null
    isMuted: boolean;
    isSpeaking?: boolean;
    isDeafened?: boolean;
    iceCandidateBuffer?: RTCIceCandidate[];
}