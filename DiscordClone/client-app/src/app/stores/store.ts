import { createContext, useContext } from "react";

import UserStore from "./userStore";
import SignalRStore from "./SignalRStore";
import { ServerStore } from './serverStore';
import { ChannelStore } from "./channelStore";
interface Store {
    userStore: UserStore,
    signalRStore: SignalRStore,
    serverStore: ServerStore,
    channelStore: ChannelStore
}

export const store: Store = {
    userStore: new UserStore(),
    signalRStore: new SignalRStore(),
    serverStore: new ServerStore(),
    channelStore: new ChannelStore(),
}

export const StoreContext = createContext(store);

export function useStore() {
    return useContext(StoreContext);
}