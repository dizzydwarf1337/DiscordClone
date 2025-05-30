import { AppBar, Box, Button, CircularProgress, Toolbar, Typography, Avatar, IconButton, Tooltip } from "@mui/material";
import { useStore } from "../stores/store";
import { Link, useNavigate } from "react-router-dom";
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function NavBar() {
    const { userStore } = useStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await userStore.LogOut();
        navigate("/");
    };

    const currentUser = userStore.getUser();

    return (
        <>
            <AppBar
                position="fixed" 
                sx={{
                    backgroundColor: "#17191c", 
                    borderBottom: '1px solid #2b3138',
                    boxShadow: 'none',
                    zIndex: (theme) => theme.zIndex.drawer + 1, 
                    height: '48px',
                    px: 2,
                }}
            >
                <Toolbar
                    sx={{
                        justifyContent: "space-between",
                        minHeight: '48px !important',
                        height: '48px',
                        padding: '0px 16px !important'
                    }}
                >
                    <Box display="flex" alignItems="center">
                        <Typography
                            variant="h6"
                            noWrap
                            component={Link}
                            to="/main"
                            sx={{
                                color: "white",
                                fontWeight: 600,
                                textDecoration: 'none',
                                '&:hover': {
                                    color: '#dcddde'
                                }
                            }}
                        >
                            Discord Clone
                        </Typography>
                    </Box>

                    {currentUser && (
                        <Box display="flex" alignItems="center" gap={1}>
                            <Tooltip title="Profile">
                                <IconButton
                                    component={Link}
                                    to={"/profile"}
                                    sx={{ color: '#b9bbbe', '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)', color: 'white' } }}
                                >
                                    {currentUser.image ? (
                                        <Avatar sx={{ width: 28, height: 28 }} src={currentUser.image} />
                                    ) : (
                                        <AccountCircleIcon sx={{ fontSize: '28px' }} />
                                    )}
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Logout">
                                <IconButton
                                    onClick={handleLogout}
                                    disabled={userStore.getLoading()}
                                    sx={{ color: '#b9bbbe', '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)', color: 'white' } }}
                                >
                                    {userStore.getLoading() ? <CircularProgress size={20} color="inherit" /> : <LogoutIcon sx={{ fontSize: '24px' }} />}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>
            {/* This Box is a spacer to prevent content from going under the fixed AppBar */}
            <Box sx={{ height: '48px' }} />
        </>
    );
}