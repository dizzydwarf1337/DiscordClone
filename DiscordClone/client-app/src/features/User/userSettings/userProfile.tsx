import { Outlet, useNavigate } from "react-router-dom";
import SettingsSideBar from "./settingsSideBar";
import { Box, IconButton } from "@mui/material";
import { HighlightOff } from "@mui/icons-material";
import theme from "../../../app/theme/theme";
import { ThemeProvider } from '@emotion/react';

export default function UserProfile() {
    const navigate = useNavigate();
    return (

        <ThemeProvider theme={theme}>
            <Box display="flex" flexDirection="row" alignItems="center" justifyContent="center" sx={{ width: "100%", height: "100%", p: "80px 100px", gap: "30px" }}>
                <Box position="absolute" right="180px" top="50px">
                    <IconButton onClick={() => {navigate("/main")} }>
                        <HighlightOff color="error"/>
                    </IconButton>
                </Box>
                <Box>
                    <SettingsSideBar />
                    </Box>
                <Box sx={{ width: "800px", height: "500px", bgcolor: "secondary.main", borderRadius: "20px", boxShadow: "3px 4px 10px 5px black" } }>
                    <Outlet />
                </Box>
            </Box>
        </ThemeProvider>
    );
}