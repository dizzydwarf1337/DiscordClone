import { Outlet, useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";
import { useStore } from "../../app/stores/store";
import { useEffect } from "react";
import { CircularProgress, ThemeProvider } from "@mui/material";
import theme from "../../app/theme/theme";



export default function AdminPanel() {
    const { userStore } = useStore();
    const navigate = useNavigate();
    useEffect(() => {
        if (userStore.user == null)
            navigate("/login");
        else if (userStore.user.role !== "Admin") navigate("/main");
    },[userStore.user]);

    if (!userStore.user) return <CircularProgress />
    return (
        <>
            <ThemeProvider theme={theme}>
                <AdminNav />
                <Outlet />
            </ThemeProvider>
        </>
    )
}