import { makeAutoObservable } from "mobx";
import { User } from "../Models/user";
import agent from "../API/agent";
import { LoginModel } from "../Models/LoginModel";
import ApiResponseModel from "../Models/ApiResponseModel";


export default class UserStore {

    constructor() {
        makeAutoObservable(this);
        const loggedIn = localStorage.getItem("isLoggedIn") === "true";
        const userData = localStorage.getItem("user");
        const tokenValue = localStorage.getItem("token");
        this.setLoggedIn(loggedIn);
        if (userData) {
            this.setUser(JSON.parse(userData));
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
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("user");
            this.setLoggedIn(false);
            this.setToken(null);
            this.deleteUser();

        }
        catch (error) {
            console.error(error);
        }
        finally {
            this.setLoading(false);
        }
    }

    LogIn = async (loginModel: LoginModel) => {
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
                console.error('Failed to update avatar', response.data.message);
                return false; // Return false if response is not successful
            }
        } catch (error) {
            console.error("Error during avatar update", error);
            return false; // Return false if there was an error
        } finally {
            this.setLoading(false); // Always set loading to false
        }

        return false; // Add this line to make sure a boolean value is returned if no update happens
    }


}