import { AppBar, Box, Button, CircularProgress, Toolbar, Typography } from "@mui/material";
import "./styles.css";
import { useStore } from "../stores/store";
import { useNavigate } from "react-router-dom";
export default function NavBar() {

    const { userStore } = useStore();
    const navigate = useNavigate()
    const handleOnClick = async () => {
        await userStore.LogOut();
        navigate("/");
        
    }
    return (
        <>
            <AppBar sx={{ backgroundColor: "#3C3C3C", zIndex: 3, pl: "50px" }}>
                <Toolbar sx={{ justifyContent: "space-between" }}>
                    <Box className="leftSideNavBox">
                        <Typography>Discord Clone</Typography>
                    </Box>



                    {userStore.getUser() && (
                        <Box display="flex" justifyContent="right" alignItems="center" gap="20px">
                            <Typography className="navLink" variant="subtitle1" component="a" href="/profile" >
                                Profile
                            </Typography>
                            <Button
                                onClick={handleOnClick}
                                className="navLink"
                                variant="contained"
                                border="none"
                                color="black"
                                disabled={userStore.getLoading()}
                                startIcon={userStore.getLoading() ? <CircularProgress size={16} /> : null}
                            >
                                Logout
                            </Button>
                        </Box>)}
                </Toolbar>
            </AppBar>
        </>
    )
}