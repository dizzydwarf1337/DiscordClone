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
            <AppBar sx={{ backgroundColor: "gray"}} >
                <Toolbar >
                    <Box display="flex" flexDirection="row" justifyContent="space-between" alignItems="center" width="100%">
                        <Box>
                            <Typography  color="black">Admin Panel</Typography>
                        </Box>
                        <Box display="flex" width="50%" justifyContent="left" gap="20px">
                            <Button variant="contained" color="primary">Users</Button>
                            <Button variant="contained" color="primary">Servers</Button>
                            <Button variant="contained" color="primary">Channels</Button>
                        </Box>
                        <Box justifyContent="right">
                            <Button variant="contained" color="primary" onClick={handleOnClick}>Log out</Button>
                        </Box>
                </Box>
                </Toolbar>
            </AppBar>
        </>
    )
}