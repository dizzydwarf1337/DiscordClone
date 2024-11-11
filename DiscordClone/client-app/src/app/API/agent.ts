import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { store } from '../stores/store';
import { LoginModel } from '../Models/LoginModel';
import { User } from '../Models/user';


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
    login: (loginModel: LoginModel, noAuth = false) => requests.post<LoginModel>('/auth/login', loginModel, noAuth),
    logout: (email: string, noAuth = false) => requests.post<void>('/auth/logout', { email }, noAuth),
};
const Users = {
    getUserById: (id: string, noAuth = false) => requests.get<User>(`/user/${id}`, noAuth),
    getUserByEmail: (email: string) => requests.post<User>('/user/email/', { email }),
    createUser: (user: User) => requests.post<LoginModel>('/user', user),
    updateUser: (user: User) => requests.put<void>(`/user/${user.id}`, user),
    changePassword: (id: string, password: string) => requests.put<void>(`/user/password/${id}`, password),
}
const agent = {
    Auth,
    Users
};

export default agent;