import { AppBar, Toolbar, Typography } from "@mui/material";
import "./styles.css";
export default function NavBar() {
    return (
        <>
            <AppBar sx={{ backgroundColor: "#3C3C3C", zIndex:3, pl:"50px"}}>
                <Toolbar >
                    <Typography>Discord Clone</Typography>
                </Toolbar>
            </AppBar>
        </>
    )
}