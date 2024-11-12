import { RouteObject, createBrowserRouter } from "react-router-dom";
import App from "../layout/App";
import HomePage from "../layout/HomePage";
import LoginDashboard from "../../features/User/loginDashboard";
import AdminPanel from "../../features/Admin/AdminPanel";


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
    }
];


export const router = createBrowserRouter(routes);