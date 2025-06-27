import { Box, Button, ButtonGroup, Typography } from "@mui/material";
import LoginForm from "./loginForm";
import RegisterForm from "./registerForm";
import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../../app/stores/store";

const LoginDashboard = observer(function LoginDashboard() {
    const [showLogin, setShowLogin] = useState(true);
    const { userStore } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (userStore.getLoggedIn()) {
            navigate("/main");
        }
    }, [navigate, userStore, userStore.getLoggedIn()]);

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100vw"
            height="100vh"
            sx={{
                backgroundColor: "#36393f",
                color: "white",
                overflow: 'hidden'
            }}
        >
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                sx={{
                    backgroundColor: "#313338",
                    borderRadius: "5px",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.24)",
                    padding: "32px",
                    width: "480px",
                    maxWidth: "calc(100% - 32px)",
                    boxSizing: 'border-box'
                }}
            >
                <Typography variant="h5" sx={{ mb: 1, color: "#ffffff", fontWeight: 600, textAlign: 'center' }}>
                    {showLogin ? "Welcome back!" : "Create an account"}
                </Typography>
                {showLogin && (
                    <Typography variant="body2" sx={{ mb: 3, color: "#b9bbbe", textAlign: 'center' }}>
                        We're so excited to see you again!
                    </Typography>
                )}


                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="stretch"
                    justifyContent="center"
                    width="100%"
                    sx={{

                    }}
                >
                    {showLogin ? <LoginForm /> : <RegisterForm />}
                </Box>

                <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                    {showLogin ? (
                        <Typography variant="caption" sx={{ color: '#72767d' }}>
                            Need an account?{' '}
                            <Typography
                                component="span"
                                onClick={() => setShowLogin(false)}
                                sx={{ color: '#00a8fc', fontWeight: 500, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            >
                                Register
                            </Typography>
                        </Typography>
                    ) : (
                        <Typography variant="caption" sx={{ color: '#72767d' }}>
                            Already have an account?{' '}
                            <Typography
                                component="span"
                                onClick={() => setShowLogin(true)}
                                sx={{ color: '#00a8fc', fontWeight: 500, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            >
                                Login
                            </Typography>
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
});
export default LoginDashboard;