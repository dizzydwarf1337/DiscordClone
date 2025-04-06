import { makeAutoObservable, runInAction } from "mobx";
import { User } from "../Models/user";
import FriendRequest from "../Models/FriendRequest";
import agent from "../API/agent";
import FriendsUsernameRequest from "../Models/FriendsUsernameRequest";
import PrivateMessage from "../Models/PrivateMessage";
import { FriendGroup } from "../Models/FriendGroup";


export default class FriendStore {

    constructor() {
        makeAutoObservable(this);
    }

    friends: User[] = [];
    friendRequests: FriendRequest[] = [];
    friendLoading: boolean = false;
    selectedFriend: User | null = null;
    friendGroups: FriendGroup[] = [];

    setFriendGroups = (groups: FriendGroup[]) => {
        this.friendGroups = groups;
    };

    getFriendGroupsByUserId = async (userId: string) => {
        const groups = await agent.Friends.FriendGroups.getByUserId(userId);
        runInAction(() => {
            this.friendGroups = groups;
        });
    };

    setFriends = (friends: User[]) => {
        runInAction(() => {
            this.friends = friends;
        })
    }
    getFriends = () => this.friends;
    setFriendsRequests = (friendRequests: FriendRequest[]) => {
        runInAction(() => {
            this.friendRequests = friendRequests;
        })
    }
    getFriendsRequests = () => this.friendRequests;
    setSelectedFriend = (friend: User) => {
        runInAction(() => {
            this.selectedFriend = friend;
        })
    }
    getSelectedFriend = () => this.selectedFriend;
    setFriendLoading = (loading: boolean) => {
        runInAction(() => {
            this.friendLoading = loading;
        })
    }
    getFriendLoading = () => this.friendLoading;

    SendFriendRequest = async (friendRequest: FriendRequest) => {
        try {
            this.setFriendLoading(true);
            await agent.Friends.SendFriendRequest(friendRequest);
            this.setFriendLoading(false);
        } catch (error) {
            console.log(error);
        }
        finally {
            this.setFriendLoading(false);
        }
    }
    SendFriendRequestUserName = async (friendUsernameRequest: FriendsUsernameRequest) => {
        try {
            this.setFriendLoading(true);
            var response = await agent.Friends.SendFriendRequestUserName(friendUsernameRequest);
            return response;
        }
        catch (error) {
            console.log(error);
        }
        finally {
            this.setFriendLoading(false);
        }
    }
    AcceptFriendRequest = async (friendRequest: FriendRequest) => {
        try {
            this.setFriendLoading(true);
            await agent.Friends.AcceptFriendRequest(friendRequest);
            
        }
        catch (error) {
            console.log(error);
        }
        finally {
            this.setFriendLoading(false);
        }
    }
    RejectFriendRequest = async (friendRequest: FriendRequest) => {
        try {
            this.setFriendLoading(true);
            await agent.Friends.RejectFriendRequest(friendRequest);
         
        }
        catch (error) {
            console.log(error);
        }
        finally {
            this.setFriendLoading(false);
        }
    }
    GetUserFriendsById = async (userId: string) => {
        try {
            this.setFriendLoading(true);
            const response = await agent.Friends.GetUserFriendsById(userId);
            return (response);
        }
        catch (error) {
            console.log(error);
        }
        finally {
            this.setFriendLoading(false);
        }
    }
    GetUserFriendRequestsById = async (userId: string) => {
        try {
            this.setFriendLoading(true);
            const response = await agent.Friends.GetUserFriendRequestsById(userId);
            return response;
        }
        catch (error) {
            console.log(error);
        }
        finally {
            this.setFriendLoading(false);
        }
    }
    SendPrivateMessage = async (messageDto: PrivateMessage)=>{
        try {
            this.setFriendLoading(true);
            await agent.Messages.SendPrivateMessage(messageDto);
        }
        catch (error) {
            console.log(error);
        }
        finally {
            this.setFriendLoading(false);
        }
    }
}

