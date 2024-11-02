import { Box, Button, ButtonGroup } from "@mui/material";
import { useStore } from "../../app/stores/store";
import LoginForm from "./loginForm";
import RegisterForm from "./RegisterForm";
import { observer } from "mobx-react-lite";
import { useState } from "react";


export default  observer (function LoginDashboard() {
    const { userStore } = useStore();
    const [login, setLogin] = useState(true);
    return (
        <Box  display="flex" flexDirection="column" justifyContent="center" alignItems="center" width="100vw" height="100vh">

            <Box bgcolor="#323232" alignItems="center" justifyContent="center" display="flex" flexDirection="column"
                sx={{
                    borderRadius: "20px",
                    boxShadow: "0px 0px 10px white",
                    width: "300px",
                    height: "400px"
                }}>
                <Box position="relative" mt="20px">
                    <ButtonGroup color="white" variant="contained" sx={{ }}>
                        <Button sx={{ backgroundColor: "white", color: "black"}} disabled={login} onClick={() => { (userStore.setLoginRegister(true)); setLogin(true); }}>Login</Button>
                        <Button sx={{ backgroundColor: "white", color:"black" }}  disabled={!login} onClick={() => { (userStore.setLoginRegister(false)); setLogin(false); }}>Register</Button>
                    </ButtonGroup>
                </Box>
                <Box  display="flex" alignItems="center" justifyContent="center" height="100%" width="100%">
            {userStore.LoginRegister ? (
                <LoginForm/>
            ) : (
                <RegisterForm/>
                    )}
            </Box>
            </Box>
        </Box>
    )
})