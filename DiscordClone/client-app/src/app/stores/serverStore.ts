import { makeAutoObservable, runInAction } from 'mobx';
import agent from '../API/agent';
import { User } from './userStore';

export class ServerStore {
    servers: any[] = [];
    selectedServer: any = null;
    loading = false;

    constructor() {
        makeAutoObservable(this);
    }

    setSelectedServer = (server: any) => {
        this.selectedServer = server;
    }

    loadUserServers = async (userId: string) => {
        this.loading = true;
        try {
            const response = await agent.Servers.getUserServers(userId);
            runInAction(() => {
                this.servers = response.data;
                this.loading = false;
            });
        } catch (error) {
            console.error('Failed to load servers', error);
            runInAction(() => {
                this.loading = false;
            });
        }
    }
}