import { createContext, useContext } from "react";

import UserStore from "./userStore";
import SignalRStore from "./SignalRStore";
interface Store {
    userStore: UserStore,
    signalRStore: SignalRStore,
}

export const store: Store = {
    userStore: new UserStore(),
    signalRStore:new SignalRStore(),
}

export const StoreContext = createContext(store);

export function useStore() {
    return useContext(StoreContext);
}