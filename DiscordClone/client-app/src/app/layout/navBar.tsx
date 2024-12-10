import { AppBar, Box, Button, CircularProgress, Toolbar, Typography } from "@mui/material";
import "./styles.css";
import { useStore } from "../stores/store";
import { Link, useNavigate } from "react-router-dom";
import { CreateServerModal } from './CreateServerModal';

export default function NavBar() {
    const { userStore } = useStore();
    const navigate = useNavigate()
    const handleOnClick = async () => {
        await userStore.LogOut();
        navigate("/");
    }

    return (
        <>
            <AppBar sx={{ backgroundColor: "secondary.main", zIndex: 3, pl: "50px" }}>
                <Toolbar sx={{ justifyContent: "space-between" }}>
                    <Box display="flex" justifyContent="right">
                        <Typography>Discord Clone</Typography>
                    </Box>
                    {userStore.getUser() && (
                        <Box display="flex" justifyContent="right" alignItems="center" gap="20px">
                            <Link to={"/profile"}>
                                <Button variant="contained" color="Primary">
                                    Profile
                                </Button>
                            </Link>
                            <Button
                                onClick={handleOnClick}
                                variant="contained"
                                color="Primary"
                                disabled={userStore.getLoading()}
                                startIcon={userStore.getLoading() ? <CircularProgress size={16} /> : null}
                            >
                                Logout
                            </Button>
                            <CreateServerModal />
                        </Box>
                    )}
                </Toolbar>
            </AppBar>
        </>
    )
}