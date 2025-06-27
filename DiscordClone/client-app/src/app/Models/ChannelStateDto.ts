import { VoiceUserDto } from "./VoiceUserDto";

export interface ChannelStateDto {
    channelId: string;
    users: VoiceUserDto[];
}