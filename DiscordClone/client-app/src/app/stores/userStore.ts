import { makeAutoObservable } from "mobx";
import { User } from "../Models/user";


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

    setUser = (user: User | null) => {
        this.user = user;
    }
    getUser = () => this.user;

    setLoggedIn = (value: boolean) => {
        this.isLoggedIn = value;
    }
    getLoggedIn = () => this.isLoggedIn;

}