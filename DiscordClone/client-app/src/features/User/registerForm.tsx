import { Box, TextField, Button } from "@mui/material";
import { Form } from "react-router-dom";

export default function RegisterForm() {
    return (
        <>
            <Box sx={{ mr: "20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                <Form>
                    <Box display="flex" justifyContent="center" flexDirection="column"> 
                        <TextField color="black" label="Email" sx={{ m:"10px 25px" }} /> 
                        <TextField color="black" label="Password" sx={{ m: "10px 25px" }} />
                        <TextField color="black" label="Confirm Password" sx={{ m: "10px 25px" }} />
                    </Box > 
                    <Box display="flex" justifyContent="Center" mt="10px" mb="10px">
                        <Button >Register</Button>
                    </Box>
                </Form>
            </Box>
        </>
    )
}