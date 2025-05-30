import { createContext, useContext } from "react";

import UserStore from "./userStore";
import ChatSignalRStore from "./chatSignalRStore";
import VoiceSignalRStore from "./voiceSignalRStore";
import { ServerStore } from './serverStore';
import { ChannelStore } from "./channelStore";
import FriendStore from "./friendStore";

interface Store {
    userStore: UserStore,
    chatSignalRStore: ChatSignalRStore,
    voiceSignalRStore: VoiceSignalRStore,
    serverStore: ServerStore,
    channelStore: ChannelStore,
    friendStore: FriendStore,
}

const friendStore = new FriendStore();
const chatSignalRStore = new ChatSignalRStore(friendStore);
const voiceSignalRStore = new VoiceSignalRStore();

export const store: Store = {
    userStore: new UserStore(),
    chatSignalRStore,
    voiceSignalRStore,
    serverStore: new ServerStore(),
    channelStore: new ChannelStore(),
    friendStore
}

export const StoreContext = createContext(store);

export function useStore() {
    return useContext(StoreContext);
}