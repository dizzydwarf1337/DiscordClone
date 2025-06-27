import { Message } from "../Models/message";
import { Server } from "../Models/Server";
import agent from "../API/agent";
import { Channel } from "../Models/Channel";
import { makeAutoObservable, runInAction } from "mobx";

export class ChannelStore {
    server: Server | null = null;
    channels: Channel[] = [];
    selectedChannel: Channel | null = null;
    messages: Message[] = [];
    loading = false;
    lastActiveTextChannelId: string | null = null;

    constructor() {
        makeAutoObservable(this, {
        });
    }

    setLoading = (loading: boolean) => this.loading = loading;
    getLoading = () => this.loading;
    setServer = (server: Server) => this.server = server;
    getServer = () => this.server;
    setChannels = (channels: Channel[]) => this.channels = channels;
    getChannelsArr = () => this.channels;
    setSelectedChannel = (channel: Channel) => {
        this.selectedChannel = channel;
        if (channel && channel.channelType === 'text') {
            this.setLastActiveTextChannelId(channel.channelId);
        }
    };
    getSelectedChannel = () => this.selectedChannel;
    setMessages = (messages: Message[]) => this.messages = messages;
    getMessages = () => this.messages;
    setLastActiveTextChannelId = (channelId: string | null) => {
        this.lastActiveTextChannelId = channelId;
    }


    getFirstTextChannelId = (): string | null => {
        const firstTextChannel = this.channels.find(c => c.channelType === 'text');
        return firstTextChannel?.channelId || null;
    }

    getChannelsApi = async (serverId: string) => {
        this.setLoading(true);
        try {
            const response = await agent.Channels.GetChannelsByServerId(serverId);
            runInAction(() => {
                this.setChannels(response);
            });
        } catch (error) {
            console.log(`Cannot load channels with provided server id ${serverId}`, error);
        } finally {
            runInAction(() => this.setLoading(false));
        }
    };

    getChannelByIdApi = async (channelId: string) => {
        this.setLoading(true);
        try {
            const response = await agent.Channels.GetChannelById(channelId);
            runInAction(() => {
                this.setSelectedChannel(response.data);
            });
        } catch (error) {
            console.log(`Cannot load channel with provided channel id ${channelId}`);
        } finally {
            runInAction(() => this.setLoading(false));
        }
    };

    createChannelApi = async (createChannel: any, userId: string) => {
        this.setLoading(true);
        try {
            const response = await agent.Channels.CreateChannel(createChannel, userId);
            runInAction(() => {
                this.setChannels([...this.channels, response.data]);
            });
        } catch (error) {
            console.log(`Cannot create channel with provided data ${createChannel}`);
        } finally {
            runInAction(() => this.setLoading(false));
        }
    };

    deleteChannelApi = async (channel: Channel, userId: string) => {
        this.setLoading(true);
        try {
            await agent.Channels.DeleteChannel(channel, userId);
            runInAction(() => {
                this.setChannels(this.channels.filter(x => x.channelId !== channel.channelId));
                if (this.lastActiveTextChannelId === channel.channelId) {
                    this.setLastActiveTextChannelId(this.getFirstTextChannelId());
                }
            });
        } catch (error) {
            console.log(`Cannot delete channel with provided data ${channel}`);
        } finally {
            runInAction(() => this.setLoading(false));
        }
    };

    getMessagesApi = async (channelId: string) => {
        this.setLoading(true);
        try {
            const response = await agent.Messages.GetAllMessages(channelId);
            runInAction(() => {
                this.setMessages(response);
            });
            return response;
        } catch (error) {
            console.log(`Cannot get messages with provided channel id ${channelId}`, error);
            return [];
        } finally {
            runInAction(() => this.setLoading(false));
        }
    };

    getMessagesFromLastDaysApi = async (channelId: string, days: number) => {
        if (!channelId) return [];
        this.setLoading(true);
        try {
            const response = await agent.Messages.GetMessagesFromLastDays(channelId, days);
            return response;
        } catch (error) {
            console.log(`Cannot get messages with provided channel id ${channelId} and days ${days}`, error);
            return [];
        } finally {
            runInAction(() => this.setLoading(false));
        }
    };
}