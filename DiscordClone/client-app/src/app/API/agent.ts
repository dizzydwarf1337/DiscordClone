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
    getUserByUserName: (userName: Object) => requests.post<ApiResponseModel>('/user/userName/', { userName }),
    createUser: (user: RegisterModel) => requests.post<ApiResponseModel>('/user/createUser', user),
    deleteUser: (id: string) => requests.delete<ApiResponseModel>(`/user/${id}`),
    updateUser: (user: User) => requests.put<ApiResponseModel>(`/user/${user.id}`, user),
    updateAvatar: (imageFile: FormData, noAuth = false) => requests.post<ApiResponseModel>('/user/update-avatar', imageFile, noAuth),
}
const agent = {
    Auth,
    Users,
    Servers: {
        createServer: async (serverData: {
            name: string,
            description?: string,
            ownerId: string,
            isPublic: boolean
        }) => {
            try {
                const response = await axios.post('/servers', serverData);
                return {
                    success: true,
                    data: response.data,
                    message: 'Server created successfully'
                };
            } catch (error) {
                return {
                    success: false,
                    data: null,
                    message: error.response?.data?.message || 'Failed to create server'
                };
            }
        },
    },
    getUserServers: async (userId: string) => {
        try {
            const response = await axios.get(`/servers/user/${userId}`);
            return {
                success: true,
                data: response.data,
                message: 'Servers retrieved successfully'
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                message: error.response?.data?.message || 'Failed to retrieve servers'
            };
        }
    },
    Channels: {
        createChannel: async (channelData: {
            name: string,
            serverId: string,
            channelType: string
        }) => {
            try {
                const response = await axios.post('/channels', channelData);
                return {
                    success: true,
                    data: response.data,
                    message: 'Channel created successfully'
                };
            } catch (error) {
                return {
                    success: false,
                    data: null,
                    message: error.response?.data?.message || 'Failed to create channel'
                };
            }
        },
    }
};

export default agent;
