import { Outlet, useNavigate } from "react-router-dom";
import SettingsSideBar from "./settingsSideBar";
import { Box, IconButton, Tooltip } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ThemeProvider } from '@emotion/react';
import theme from "../../../app/theme/theme";

export default function UserProfile() {
    const navigate = useNavigate();

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100vw',
                    height: '100vh',
                    bgcolor: "#2f3136",
                    overflow: 'hidden',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 1100
                }}
            >
                {/* Left Settings Navigation Sidebar */}
                <Box sx={{
                    width: "218px",
                    flexShrink: 0,
                    height: "100%",
                    bgcolor: "#2f3136",
                    pt: '20px',
                    pb: '20px',
                    pr: '6px',
                    pl: '20px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <SettingsSideBar />
                </Box>

                {/* Right Content Area for Settings (Outlet) */}
                <Box
                    sx={{
                        flexGrow: 1,
                        height: "100%",
                        bgcolor: "#36393f",
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* Top Bar of the Content Area  */}
                    <Box sx={{
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        px: '20px',
                        borderBottom: '1px solid #202225',
                        boxSizing: 'border-box',
                        flexShrink: 0,
                        color: '#dcddde'
                    }}>
                        <Tooltip title="Go Back" placement="bottom">
                            <IconButton
                                onClick={() => { navigate("/main") }}
                                sx={{
                                    color: '#b9bbbe',
                                    mr: 2,
                                    '&:hover': { color: '#dcddde', backgroundColor: 'rgba(255,255,255,0.04)' }
                                }}
                            >
                                <ArrowBackIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Scrollable Content Area for Outlet */}
                    <Box sx={{
                        flexGrow: 1,
                        overflowY: 'auto',
                        boxSizing: 'border-box',
                    }}>
                        <Outlet />
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
}