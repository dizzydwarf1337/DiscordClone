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

    setUser = (user: User ) => {
        this.user = user;
    }
    setUserPhoto = (photo: string) => {
        this.user!.image = photo;
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
            const LoginResponse : ApiResponseModel = await agent.Auth.login(loginModel);
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
            console.error("Error during login",error);
            return error.response.data.message; 
        }
        finally {
            this.setLoading(false);
        }
    }
    updateUserField = async (data) => {
        this.setLoading(true);
        try {
            let updatedUser: User = {
                id: this.user.id,
                username: data.username,
                email: data.email,
                image: data.image,
                role: "user",
            };

            const response = await agent.Users.updateUser(updatedUser);
            if (response.success) {
                this.setUser(updatedUser);
                localStorage.setItem("user", JSON.stringify(this.user));
                console.log(response.message);
            }
        }
        catch (error: Error) {
            console.log("Error while updating user ", error);
        }
        finally {
            this.setLoading(false); 
        }
    };
    updateUserAvatar = async (imageFile: FormData) => {
        this.setLoading(true);
        try {
            const response = await agent.Users.updateAvatar(imageFile);
            this.setUserPhoto(response.data.avatarUrl);
            localStorage.setItem("user", JSON.stringify(this.user));
        } catch (error: Error) {
            console.error("Error while updating avatar", error);
        } finally {
            this.setLoading(false);
        }
    };

}