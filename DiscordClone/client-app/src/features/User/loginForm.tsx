import { Box, Button, TextField, Typography } from "@mui/material";
import { Form, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LoginModel } from "../../app/Models/LoginModel";
import { useStore } from "../../app/stores/store";

export default function LoginForm() {


    const { userStore } = useStore();
    const navigate = useNavigate();
    const [loginModel, setLoginModel] = useState<LoginModel>({
        username: "",
        password: ""
    });
    const [error, setError] = useState<string>("");

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setLoginModel((prevModel) => ({
            ...prevModel,
            [name]: value
        }));
    };
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const response: any = await userStore.LogIn(loginModel);
        if (response == true) {
            if (userStore.user.role === "Admin") {
                navigate("/adminPanel");
            }
            else navigate("/main");
        }
        else setError(response);
    };

    return (
        <>
            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", justifyItems: "center", alignItems: "center" }}>
                <Form onSubmit={handleSubmit}>
                    <Box display="flex" justifyContent="center" flexDirection="column">
                        <TextField onChange={handleInputChange} name="username" color="black" label="UserName" sx={{ m: "10px 25px" }} autoComplete="username"/>
                        <TextField onChange={handleInputChange} name="password" color="black" label="Password" type="password" sx={{ m: "10px 25px" }} autoComplete="current-password" />
                    </Box>
                    <Typography color="red" textAlign="center">{error}</Typography>
                    <Box display="flex" justifyContent="Center" mt="10px" mb="10px">
                        <Button type="submit">Login</Button>
                    </Box>
                </Form>
            </Box>
        </>
    )
}