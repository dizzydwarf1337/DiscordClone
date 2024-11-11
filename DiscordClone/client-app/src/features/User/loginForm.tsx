import { Box, Button, TextField } from "@mui/material";
import { Form, useNavigate } from "react-router-dom";
import agent from "../../app/API/agent";
import { useState } from "react";
import { LoginModel } from "../../app/Models/LoginModel";
import { useStore } from "../../app/stores/store";
import ApiResponseModel from "../../app/Models/ApiResponseModel";

export default function LoginForm() {


    const { userStore } = useStore();
    const navigate = useNavigate();
    const [loginModel, setLoginModel] = useState<LoginModel>({
        username: "",
        password: ""
    });

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setLoginModel((prevModel) => ({
            ...prevModel,
            [name]: value
        }));
    };
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            userStore.setLoading(true);
            const response: ApiResponseModel = await agent.Auth.login(loginModel);
            if (response) {
                userStore.token = response.data.token;
                const user = await agent.Users.getUserByUserName(loginModel.username);
                userStore.setUser(user);
                userStore.setLoggedIn(true);
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("user", JSON.stringify(user));
                localStorage.setItem("token", response.data.token);
                console.log(userStore.getToken(), user, userStore.isLoggedIn)
                navigate("/main");
            }
            else throw new Error;
        } catch (error) {
            console.error("invalid login data",error);
        }
        finally {
            userStore.setLoading(false);
        }

    };

    return (
        <>
            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", justifyItems: "center", alignItems: "center" }}>
                <Form onSubmit={handleSubmit}>
                    <Box display="flex" justifyContent="center" flexDirection="column">
                        <TextField onChange={handleInputChange} name="username" color="black" label="UserName" sx={{ m: "10px 25px" }}></TextField>
                        <TextField onChange={handleInputChange} name="password" color="black" label="Password" type="password" sx={{ m: "10px 25px" }}></TextField>
                    </Box>
                    <Box display="flex" justifyContent="Center" mt="10px" mb="10px">
                        <Button type="submit">Login</Button>
                    </Box>
                </Form>
            </Box>
        </>
    )
}