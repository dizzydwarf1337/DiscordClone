import { createContext, useContext } from "react";

import UserStore from "./userStore";
import SignalRStore from "./SignalRStore";
import { ServerStore } from './serverStore';
interface Store {
    userStore: UserStore,
    signalRStore: SignalRStore,
    serverStore: ServerStore,
}

export const store: Store = {
    userStore: new UserStore(),
    signalRStore: new SignalRStore(),
    serverStore: new ServerStore(),
}

export const StoreContext = createContext(store);

export function useStore() {
    return useContext(StoreContext);
}