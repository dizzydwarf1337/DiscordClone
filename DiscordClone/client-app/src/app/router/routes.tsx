import { RouteObject, createBrowserRouter } from "react-router-dom";
import App from "../layout/App";
import AdminPanel from "../../features/Admin/AdminPanel";
import UserProfile from "../../features/User/userSettings/userProfile";
import HomePage from "../layout/homePage";
import LoginDashboard from "../../features/User/userAuth/loginDashboard";
import ProfileSetting from "../../features/User/userSettings/profileSetting";
import Test from "../../features/User/userSettings/test";


export const routes: RouteObject[] = [
    {
        path: '/',
        element: <App />,
        children: [
            { index: true, element: <HomePage /> },
            { path: 'main', element: <App /> }, 
            { path: 'login', element: <LoginDashboard /> },
        ]
    },
    {
        path: '/adminPanel',
        element: <AdminPanel />,
        children: [
        ]
    },
    {
        path: '/profile',
        element: <UserProfile />,
        children: [
            {
                path: '/profile',
                element: <ProfileSetting />,
            },
        ]
    },
];


export const router = createBrowserRouter(routes);