import { Box, TextField, Button } from "@mui/material";
import { Form, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useStore } from "../../../app/stores/store";
import agent from "../../../app/API/agent";
import RegisterModel from "../../../app/Models/RegisterModel";


export default function RegisterForm() {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState('');
    const { userStore } = useStore(); 
    const navigate = useNavigate();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setError(""); 

        let registerModel: RegisterModel = {
            email: formData.email,
            password: formData.password,
            username: formData.username
        };

        agent.Users.createUser(registerModel)
            .then(() => {
                console.log("User registered successfully");
                userStore.LogIn({ username: registerModel.username, password: registerModel.password }).then(response => {
                    if (response == true) {
                        if (userStore.user.role === "Admin") {
                            navigate("/adminPanel");
                        }
                        else navigate("/main");
                    }
                    else setError(response);
                });
            })
            .catch((err) => {
                console.error("Error during registration:", err);
                setError(err.response.data.title);
            });
       
    };

    return (
        <Box sx={{ mr: "20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <Form onSubmit={handleSubmit}>
                <Box display="flex" justifyContent="center" flexDirection="column">
                    <TextField
                        color="black"
                        label="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        sx={{ m: "10px 25px" }}
                    />
                    <TextField
                        color="black"
                        label="UserName"
                        name="username"
                        value={formData.username} 
                        onChange={handleInputChange}
                        sx={{ m: "10px 25px" }}
                        autoComplete="username"
                    />
                    <TextField
                        color="black"
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        sx={{ m: "10px 25px" }}
                        autoComplete="current-password"
                    />
                    <TextField
                        color="black"
                        label="Confirm Password"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        sx={{ m: "10px 25px" }}
                        autoComplete="current-password"
                    />
                </Box>
                {error && (
                    <Box sx={{ color: 'red', textAlign: 'center', mb: 2 }}>
                        {error}
                    </Box>
                )}
                <Box display="flex" justifyContent="Center" mt="10px" mb="10px">
                    <Button type="submit">Register</Button>
                </Box>
            </Form>
        </Box>
    );
}
