import { makeAutoObservable, runInAction } from "mobx";
import SignalRStore from "./SignalRStore";

export default class GroupCallStore{
    signalRStore: SignalRStore;
    currentGroupCall: {
        groupId: string;
        participants: Map<string, RTCPeerConnection>;
    } | null = null;

    constructor(signalrStore: SignalRStore) {
        makeAutoObservable(this);
        this.signalRStore = signalrStore;
    }
}