import { Box, Button, ButtonGroup, Typography } from "@mui/material";
import LoginForm from "./loginForm";
import RegisterForm from "./registerForm";
import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { useStore } from "../../app/stores/store";
import { useNavigate } from "react-router-dom";

export default observer(function LoginDashboard() {
    const [login, setLogin] = useState(true);
    const [LoginRegister, setLoginRegister] = useState(true);
    const { userStore } = useStore();
    const navigate = useNavigate();
    useEffect(() => {
        if (userStore.getLoggedIn()) {
            navigate("/main");
        }
    }, [navigate, userStore]);
    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100vw"
            height="100vh"
            sx={{
                background: "linear-gradient(135deg, #232526, #414345)",
                color: "white",
            }}
        >
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                sx={{
                    background: "linear-gradient(145deg, #1f1f1f, #333333)",
                    borderRadius: "25px",
                    boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.7)",
                    padding: "40px 30px",
                    width: "350px",
                    maxWidth: "90%",
                }}
            >
                <Typography variant="h4" sx={{ mb: 4, color: "#E0E0E0", fontWeight: "bold" }}>
                    {login ? "Welcome Back!" : "Join Us Today!"}
                </Typography>

                <ButtonGroup
                    variant="outlined"
                    sx={{
                        mb: 4,
                        backgroundColor: "transparent",
                        borderRadius: "15px",
                        overflow: "hidden",
                        width: "100%",
                        border: "1px solid #4e4e4e",
                    }}
                >
                    <Button
                        sx={{
                            flex: 1,
                            backgroundColor: login ? "black" : "rgba(255, 255, 255, 0.2)",
                            color: !login ? "white" : "#ddd",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            border: "none",
                            transition: "all 0.3s",
                            '&:hover': {
                                backgroundColor: login ? "#1565c0" : "rgba(255, 255, 255, 0.3)",
                                boxShadow: "inset 0px 0px 10px rgba(255, 255, 255, 0.2)",
                            },
                        }}
                        disabled={login}
                        onClick={() => {
                            setLoginRegister(true);
                            setLogin(true);
                        }}
                    >
                        Login
                    </Button>
                    <Button
                        sx={{
                            flex: 1,
                            backgroundColor: !login ? "black" : "rgba(255, 255, 255, 0.2)",
                            color: login ? "white" : "#ddd",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            border: "none",
                            transition: "all 0.3s",
                            '&:hover': {
                                backgroundColor: !login ? "#1565c0" : "rgba(255, 255, 255, 0.3)",
                                boxShadow: "inset 0px 0px 10px rgba(255, 255, 255, 0.2)",
                            },
                        }}
                        disabled={!login}
                        onClick={() => {
                            setLoginRegister(false);
                            setLogin(false);
                        }}
                    >
                        Register
                    </Button>
                </ButtonGroup>

                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    width="100%"
                    sx={{
                        transition: "opacity 0.5s, transform 0.5s",
                        opacity: LoginRegister ? 1 : 0.9,
                        transform: LoginRegister ? "scale(1)" : "scale(0.95)",
                        overflow: "hidden",
                    }}
                >
                    {LoginRegister ? <LoginForm /> : <RegisterForm />}
                </Box>
            </Box>
        </Box>
    );
});
