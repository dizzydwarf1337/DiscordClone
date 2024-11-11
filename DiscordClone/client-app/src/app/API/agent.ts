import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { store } from '../stores/store';
import { LoginModel } from '../Models/LoginModel';
import { User } from '../Models/user';
import ApiResponseModel from '../Models/ApiResponseModel';
import RegisterModel from '../Models/RegisterModel';


axios.defaults.baseURL = 'http://localhost:5000/api';

axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {

    if (config.headers && !config.headers['NoAuth']) {
        const token = store.userStore.getToken();
        token ? token : localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return config;
});

const responseBody = (response: AxiosResponse) => response.data;

const requests = {
    get: <T>(url: string, noAuth = false) =>
        axios.get<T>(url, { headers: { NoAuth: noAuth } }).then(responseBody),
    post: <T>(url: string, body: {}, noAuth = false) =>
        axios.post<T>(url, body, { headers: { NoAuth: noAuth } }).then(responseBody),
    put: <T>(url: string, body: {}, noAuth = false) =>
        axios.put<T>(url, body, { headers: { NoAuth: noAuth } }).then(responseBody),
    delete: <T>(url: string, noAuth = false) =>
        axios.delete<T>(url, { headers: { NoAuth: noAuth } }).then(responseBody),
};


const Auth = {
    login: (loginModel: LoginModel, noAuth = false) => requests.post<ApiResponseModel>('/auth/login', loginModel, noAuth),
    logout: ( noAuth = false) => requests.post<void>('/auth/logout', noAuth),
};
const Users = {
    getUserById: (id: string, noAuth = false) => requests.get<ApiResponseModel>(`/user/${id}`, noAuth),
    getUserByUserName: (userName: string) => requests.post<ApiResponseModel>('/user/userName/', {userName}),
    createUser: (user: RegisterModel) => requests.post<ApiResponseModel>('/user/createUser', user),
    deleteUser: (id: string) => requests.delete<ApiResponseModel>(`/user/${id}`),
    updateUser: (user: User) => requests.put<ApiResponseModel>(`/user/${user.id}`, user),
    
}
const agent = {
    Auth,
    Users
};

export default agent;