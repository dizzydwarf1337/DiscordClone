import { Box, Button, TextField } from "@mui/material";
import { Form } from "react-router-dom";

export default function LoginForm() {
    return (
        <>
            <Box sx={{ mr:"20px", display:"flex", flexDirection:"column", justifyContent:"center", justifyItems:"center", alignItems:"center" } }>
                <Form>
                    <TextField color="black" label="Email" sx={{ m: "10px 25px" }}></TextField>
                    <TextField color="black" label="Password" sx={{ m: "10px 25px" }}></TextField>
                    <Box display="flex" justifyContent="Center" mt="50px">
                        <Button >Login</Button>
                    </Box>
                </Form>
            </Box>
        </>
    )
}