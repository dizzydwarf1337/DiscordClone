import { makeAutoObservable } from "mobx";

export default class UserStore {
    [x: string]: any;

    constructor() {
        makeAutoObservable(this);
    }

    LoginRegister = true;
    IsLoggedIn = false;
    setLoginRegister = (value: boolean) => {
        this.LoginRegister = value;
    };
    setIsLoggedIN = (value: boolean) => {
        this.IsLoggedIn = value;
    };
}