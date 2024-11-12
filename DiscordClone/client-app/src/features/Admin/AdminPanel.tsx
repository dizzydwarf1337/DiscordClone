import { Outlet, useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";
import { useStore } from "../../app/stores/store";
import { useEffect } from "react";
import { CircularProgress } from "@mui/material";



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
            <AdminNav />
            <Outlet/>
        </>
    )
}