import { makeAutoObservable } from "mobx";
import { User } from "../Models/user";
import agent from "../API/agent";
import { LoginModel } from "../Models/LoginModel";
import ApiResponseModel from "../Models/ApiResponseModel";


const API_BASE_URL = "http://localhost:5000";

export default class UserStore {
    constructor() {
        makeAutoObservable(this);
        const loggedIn = localStorage.getItem("isLoggedIn") === "true";
        const userData = localStorage.getItem("user");
        const tokenValue = localStorage.getItem("token");
        this.setLoggedIn(loggedIn);
        if (userData) {
            const parsedUser = JSON.parse(userData);
            this.setUser(this.enrichUserWithFullAvatarUrl(parsedUser));
            this.setToken(tokenValue);
        }
    }

    token: string | null = null;
    user: User | null = null;
    isLoggedIn: boolean = false;
    loading: boolean = false;

    enrichUserWithFullAvatarUrl = (user: User): User => {
        if (user.image && !user.image.startsWith("http")) {
            return { ...user, image: `${API_BASE_URL}${user.image}` };
        }
        return user;
    };

    get userAvatarUrl(): string | null {
        return this.user?.image ?? null;
    }

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

    setUserPhoto = (photo: string) => {
        if (this.user) {
            this.user.image = this.enrichUserWithFullAvatarUrl({ ...this.user, image: photo }).image;
        }
    }
    getUser = () => this.user;

    deleteUser = () => {
        this.user = null;
    }

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
            localStorage.removeItem("token");
            this.setLoggedIn(false);
            this.setToken(null);
            this.deleteUser();
        } catch (error) {
            console.error(error);
        } finally {
            this.setLoading(false);
        }
    }

    LogIn = async (loginModel: LoginModel) => {
        this.setLoading(true);
        try {
            const loginResponse: ApiResponseModel = await agent.Auth.login(loginModel);
            if (loginResponse.success) {
                const userResponse: ApiResponseModel = await agent.Users.getUserByUserName(loginModel.username);
                if (userResponse.success) {
                    const enrichedUser = this.enrichUserWithFullAvatarUrl(userResponse.data);
                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("user", JSON.stringify(enrichedUser));
                    localStorage.setItem("token", loginResponse.data.token);
                    this.setUser(enrichedUser);
                    this.setLoggedIn(true);
                    this.setToken(loginResponse.data.token);
                    return true;
                } else {
                    return userResponse.data.message;
                }
            } else {
                return loginResponse.data.message;
            }
        } catch (error: any) {
            console.error("Error during login", error);
            return error?.response?.data?.message ?? "Unexpected login error";
        } finally {
            this.setLoading(false);
        }
    }

    updateUserField = async (data: Partial<User>) => {
        this.setLoading(true);
        try {
            const updatedUser: User = {
                ...this.user!,
                ...data
            };
            const response = await agent.Users.updateUser(updatedUser);
            if (response.success) {
                const enrichedUser = this.enrichUserWithFullAvatarUrl(updatedUser);
                this.setUser(enrichedUser);
                localStorage.setItem("user", JSON.stringify(enrichedUser));
            }
        } catch (error: any) {
            console.log("Error while updating user", error);
        } finally {
            this.setLoading(false);
        }
    };

    updateUserAvatar = async (imageFile: FormData) => {
        this.setLoading(true);
        try {
            const response = await agent.Users.updateAvatar(imageFile);
            this.setUserPhoto(response.data.avatarUrl);
            localStorage.setItem("user", JSON.stringify(this.user));
        } catch (error: any) {
            console.error("Error while updating avatar", error);
        } finally {
            this.setLoading(false);
        }
    };
}
