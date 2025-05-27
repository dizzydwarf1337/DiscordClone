import { createContext, useContext } from "react";

import UserStore from "./userStore";
import SignalRStore from "./SignalRStore";
import { ServerStore } from './serverStore';
import { ChannelStore } from "./channelStore";
import FriendStore from "./friendStore";
import CallStore from "./CallStore";
interface Store {
    userStore: UserStore,
    signalRStore: SignalRStore,
    serverStore: ServerStore,
    channelStore: ChannelStore,
    friendStore: FriendStore,
    callStore: CallStore,
}

const friendStore = new FriendStore();
const signalRStore = new SignalRStore(friendStore);

export const store: Store = {
    userStore: new UserStore(),
    signalRStore,
    serverStore: new ServerStore(),
    channelStore: new ChannelStore(),
    friendStore,
    callStore: new CallStore(signalRStore),
}

export const StoreContext = createContext(store);

export function useStore() {
    return useContext(StoreContext);
}