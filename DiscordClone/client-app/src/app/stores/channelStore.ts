
import  Message  from "../Models/message";
import { Server } from "../Models/Server";
import agent from "../API/agent";
import { Channel } from "../Models/Channel";
import { makeAutoObservable } from "mobx";

export class ChannelStore {
    constructor() {
        makeAutoObservable(this);
    }
    server: Server | null = null;
    channels: Channel[] = [];
    selectedChannel: Channel | null = null;
    messages: Message[] = [];
    loading = false;

    setLoading = (loading: boolean) => this.loading = loading;
    getLoading = () => this.loading;
    setServer = (server: Server) => this.server = server;
    getServer = () => this.server;
    setChannels = (channels: Channel[]) => this.channels = channels;
    getChannels = () => this.channels;
    setSelectedChannel = (channel: Channel) => this.selectedChannel = channel;
    getSelectedChannel = () => this.selectedChannel;
    setMessages = (messages: Message[]) => this.messages = messages;
    getMessages = () => this.messages;
    getChannelsApi = async (serverId: string) => {
        this.setLoading(true);
        try {
            var response = await agent.Channels.GetChannelsByServerId(serverId);
            this.setChannels(response);
        }
        catch (error) {
            console.log(`Cannot load channels with provided server id ${serverId}`,error);
        }
        finally {
            this.setLoading(false);
        }
    };
    getChannelByIdApi = async (channelId: string) => {
        this.setLoading(true);
        try {
            var response = await agent.Channels.GetChannelById(channelId);
            this.setSelectedChannel(response.data);
        }
        catch (error) {
            console.log(`Cannot load channel with provided channel id ${channelId}`);
        }
        finally {
            this.setLoading(false);
        }
    };
    createChannelApi = async (createChannel: any, userId: string) => {
        this.setLoading(true);
        try {
            var response = await agent.Channels.CreateChannel(createChannel, userId);
            this.setChannels([...this.channels, response.data]);
        }
        catch (error) {
            console.log(`Cannot create channel with provided data ${createChannel}`);
        }
        finally {
            this.setLoading(false);
        }
    };
    deleteChannelApi = async (channel: Channel, userId: string) => {
        this.setLoading(true);
        try {
            await agent.Channels.DeleteChannel(channel, userId);
            this.setChannels(this.channels.filter(x => x.channelId !== channel.channelId));
        }
        catch (error) {
            console.log(`Cannot delete channel with provided data ${channel}`);
        }
        finally {
            this.setLoading(false);
        }
    };
   
    getMessagesApi = async (channelId: string) => {
        this.setLoading(true);
        try {
            var response = await agent.Messages.GetAllMessages(channelId);
            this.setMessages(response);
        }
        catch (error) {
            console.log(`Cannot get messages with provided channel id ${channelId}`,error);
        }
        finally {
            this.setLoading(false);
        }
    };
    getMessagesFromLastDaysApi = async (channelId: string, days: number) => {
        this.setLoading(true);
        try {
            var response = await agent.Messages.GetMessagesFromLastDays(channelId, days);
            return response;
        }
        catch (error) {
            console.log(`Cannot get messages with provided channel id ${channelId} and days ${days}`,error);
        }
        finally {
            this.setLoading(false);
        }
    };

}