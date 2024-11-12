import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { useStore } from "../../app/stores/store";
import { useNavigate } from "react-router-dom";

export default function AdminNav() {

    const { userStore } = useStore();
    const navigate = useNavigate();

    const handleOnClick = async () => {
        await userStore.LogOut();
            navigate("/login");
        

    }

    return (
        <>
            <AppBar sx={{backgroundColor:"gray"} }>
                <Toolbar>
                    <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="center" width="100%">
                        <Box>
                            <Typography>Admin Panel</Typography>
                        </Box>
                        <Box justifyContent="right">
                            <Button sx={{}} onClick={handleOnClick}>Log out</Button>
                        </Box>
                </Box>
                </Toolbar>
            </AppBar>
        </>
    )
}