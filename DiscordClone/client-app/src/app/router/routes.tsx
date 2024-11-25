import { RouteObject, createBrowserRouter } from "react-router-dom";
import App from "../layout/App";
import HomePage from "../layout/HomePage";
import ProfilePage from "../layout/ProfilePage";
import LoginDashboard from "../../features/User/loginDashboard";
import AdminPanel from "../../features/Admin/AdminPanel";
import AdminDashboard from "../../features/Admin/AdminDashboard";


export const routes: RouteObject[] = [
    {
        path: '/',
        element: <App />,
        children: [
            { index: true, element: <HomePage /> },
            { path: 'main', element: <App /> },
            { path: 'login', element: <LoginDashboard /> },
            { path: 'profilepage', element: <ProfilePage /> },
        ]
    },
    {
        path: '/adminPanel',
        element: <AdminPanel />,
        children: [
        ]
    }
];


export const router = createBrowserRouter(routes);