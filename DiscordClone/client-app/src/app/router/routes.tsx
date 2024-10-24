import { RouteObject, createBrowserRouter } from "react-router-dom";
import App from "../layout/App";
import HomePage from "../layout/HomePage";


export const routes: RouteObject[] = [
    {
        path: '/',
        element: <App />,
        children: [
            { index: true, element: <HomePage /> },
            { path: 'main', element: <App /> },
        ]
    }
]


export const router = createBrowserRouter(routes);