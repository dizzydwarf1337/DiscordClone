import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import "./styles.css";
export default function NavBar() {
    return (
        <>
            <AppBar sx={{ backgroundColor: "#3C3C3C", zIndex: 3, pl: "50px" }}>
                <Toolbar sx={{ justifyContent: "space-between" }}>
                    <Box className="leftSideNavBox">
                        <Typography>Discord Clone</Typography>
                    </Box>



                    <Box className="rightSideNavBox">
                        Profile Settings
                    </Box>
                </Toolbar>
            </AppBar>
        </>
    )
}