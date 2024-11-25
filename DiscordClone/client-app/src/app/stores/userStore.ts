import { makeAutoObservable } from "mobx";
import { User } from "../Models/user";
import agent from "../API/agent";
import { LoginModel } from "../Models/LoginModel";
import ApiResponseModel from "../Models/ApiResponseModel";


export default class UserStore {

    /*constructor() {
        makeAutoObservable(this);
        const loggedIn = localStorage.getItem("isLoggedIn") === "true";
        const userData = localStorage.getItem("user");
        const tokenValue = localStorage.getItem("token");
        this.setLoggedIn(loggedIn);
        if (userData) {
            this.setUser(JSON.parse(userData));
            this.setToken(tokenValue);
        }
    }*/

    constructor() {
        makeAutoObservable(this);
        const loggedIn = localStorage.getItem("isLoggedIn") === "true";
        const userData = localStorage.getItem("user");
        const tokenValue = localStorage.getItem("token");
        const lastAvatarUrl = localStorage.getItem("lastAvatarUrl");

        this.setLoggedIn(loggedIn);

        if (userData) {
            const parsedUser = JSON.parse(userData);
            this.setUser({
                ...parsedUser,
                avatarUrl: parsedUser.avatarUrl || lastAvatarUrl || 'default-avatar.png'
            });
            this.setToken(tokenValue);
        }
    }

    

    token: string | null = null;
    user: User | null = null;
    isLoggedIn: boolean = false;
    loading: boolean = false;
    setToken = (token: string | null) => {
        this.token = token;
    }
    getToken = () => this.token;

    setLoading = (value: boolean) => {
        this.loading = value;
    }
    getLoading = () => this.loading;

    setUser = (user: User) => {
        this.user = user;
    }
    getUser = () => this.user;
    deleteUser = () => this.user = null;
    setLoggedIn = (value: boolean) => {
        this.isLoggedIn = value;
    }
    getLoggedIn = () => this.isLoggedIn;


    LogOut = async () => {
    try {
        this.setLoading(true);
        await agent.Auth.logout();
        
        // Keep the avatar URL when clearing other data
        const avatarUrl = this.user?.avatarUrl;
        
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("token");
        this.setLoggedIn(false);
        this.setToken(null);
        this.deleteUser();

        // If you have an avatar, store it separately
        if (avatarUrl) {
            localStorage.setItem("lastAvatarUrl", avatarUrl);
        }
    }
    catch (error) {
        console.error(error);
    }
    finally {
        this.setLoading(false);
    }
}

    /*LogIn = async (loginModel: LoginModel) => {
        this.setLoading(true);
        try {
            const LoginResponse: ApiResponseModel = await agent.Auth.login(loginModel);
            if (LoginResponse.success) {
                console.log(LoginResponse.data);
                const UserResponse: ApiResponseModel = await agent.Users.getUserByUserName(loginModel.username);
                if (UserResponse.success) {
                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("user", JSON.stringify(UserResponse.data));
                    localStorage.setItem("token", LoginResponse.data.token);
                    this.setUser(UserResponse.data);
                    this.setLoggedIn(true);
                    this.setToken(LoginResponse.data.token);
                    return true;
                }
                else return UserResponse.data.message;
            }
            else return LoginResponse.data.message;
        }
        catch (error: Error) {
            console.error("Error during login", error);
            return error.response.data.message;
        }
        finally {
            this.setLoading(false);
        }
    }*/

    LogIn = async (loginModel: LoginModel) => {
    this.setLoading(true);
    try {
        const LoginResponse: ApiResponseModel = await agent.Auth.login(loginModel);
        if (LoginResponse.success) {
            const UserResponse: ApiResponseModel = await agent.Users.getUserByUserName(loginModel.username);
            if (UserResponse.success) {
                // Add explicit console logging to debug
                console.log('User Response Data:', UserResponse.data);
                console.log('Avatar URL:', UserResponse.data.avatarUrl);

                const userWithAvatar = {
                    ...UserResponse.data,
                    avatarUrl: UserResponse.data.avatarUrl || 'default-avatar.png'
                };

                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("user", JSON.stringify(userWithAvatar));
                localStorage.setItem("token", LoginResponse.data.token);

                this.setUser(userWithAvatar);
                this.setLoggedIn(true);
                this.setToken(LoginResponse.data.token);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Login error", error);
        return false;
    } finally {
        this.setLoading(false);
    }
}
    updateAvatar = async (file: File): Promise<boolean> => {
        this.setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await agent.Users.updateAvatar(formData);
            if (response.success) {
                if (this.user) { // Ensure user is not null
                    const updatedUser: User = {
                        ...this.user,
                        avatarUrl: response.data.avatarUrl // Update the avatarUrl
                    };
                    this.setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    return true; // Successfully updated the avatar
                }
            } else {
                console.error('Failed to update avatar:', response.message);
                return false; // Return false if response is not successful
            }
        } catch (error) {
            console.error("Error during avatar update:", error);
            return false; // Return false if there was an error
        } finally {
            this.setLoading(false); // Always set loading to false
        }

        return false; // Add this line to make sure a boolean value is returned if no update happens
    }

    setUserAvatarUrl = (avatarUrl: string) => {
        if (this.user) {
            this.user.avatarUrl = avatarUrl; // Set the new avatar URL
        }
    };


    refreshUserData = async () => {
        if (this.user) {
            try {
                const UserResponse: ApiResponseModel = await agent.Users.getUserByUserName(this.user.username);
                if (UserResponse.success) {
                    const updatedUser = {
                        ...UserResponse.data,
                        avatarUrl: UserResponse.data.avatarUrl || 'default-avatar.png'
                    };

                    this.setUser(updatedUser);
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                }
            } catch (error) {
                console.error("Error refreshing user data", error);
            }
        }
    }



}