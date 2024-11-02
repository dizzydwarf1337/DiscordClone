import { RouteObject, createBrowserRouter } from "react-router-dom";
import App from "../layout/App";
import HomePage from "../layout/HomePage";
import LoginDashboard from "../../features/User/loginDashboard";


export const routes: RouteObject[] = [
    {
        path: '/',
        element: <App />,
        children: [
            { index: true, element: <HomePage /> },
            { path: 'main', element: <App /> },
            { path: 'login', element: <LoginDashboard /> },
        ]
    }
]


export const router = createBrowserRouter(routes);