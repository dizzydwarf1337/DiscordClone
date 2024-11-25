import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function SettingsSideBar() {

    const navigate = useNavigate();

    const [selected, setSelected] = useState();

    return (
        <>
            <Box display="flex" alignItems="center" justifyContent="center" sx={{ height: "500px", width: "280px", bgcolor: "#3C3C3C", borderRadius:"20px", boxShadow:"4px 3px 10px 5px black"}}>
                <Box sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "start",alignItems:"center", mt: "20px", gap:"30px"}}>
                    <Typography variant="subtitle1">Settings</Typography>
                    <Box borderRadius="20px" width="90%" height="7%" display="flex" alignItems="center" justifyContent="center">
                        <Button variant="outlined" color="inherit" sx={{ width: "100%" }} onClick={() => { navigate("./") }} >Profile</Button>
                    </Box>
                    <Box borderRadius="20px" width="90%" height="7%" display="flex" alignItems="center" justifyContent="center">
                        <Button variant="outlined" color="inherit" sx={{ width: "100%", color:"#D32929" }} onClick={() => { navigate("./") }} >Delete Account</Button>
                    </Box>
                </Box>

            </Box>
        </>
    )
}