import { RouteObject, createBrowserRouter } from "react-router-dom";
import App from "../layout/App";
import AdminPanel from "../../features/Admin/AdminPanel";
import UserProfile from "../../features/User/userSettings/userProfile";
import HomePage from "../layout/homePage";
import LoginDashboard from "../../features/User/userAuth/loginDashboard";
import ProfileSetting from "../../features/User/userSettings/profileSetting";
import ChannelDashboard from "../../features/User/server/channelDashboard";
import ChannelProfile from "../../features/User/server/channelProfile";

export const routes: RouteObject[] = [
    {
        path: '/', 
        element: <App />,
        children: [
            { index: true, element: <HomePage /> }, 
            { path: 'login', element: <LoginDashboard /> },
            {
                path: 'server/:serverId', 
                element: <ChannelDashboard />,
                children: [
                    { path: ':channelIdParam', element: <ChannelProfile /> }, 
                ],
            },
            {
                path: 'main', element: <App />
            },
        ],
    },
    {
        path: '/adminPanel', 
        element: <AdminPanel />,
    },
    {
        path: '/profile', 
        element: <UserProfile />,
        children: [
            { path: '/profile', element: <ProfileSetting /> }, 
        ],
    },
];

export const router = createBrowserRouter(routes);
