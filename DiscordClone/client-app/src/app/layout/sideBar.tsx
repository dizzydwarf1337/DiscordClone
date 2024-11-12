import { Box, Drawer } from "@mui/material";

export default function SideBar() {
    return (
        <>
            <Drawer variant="permanent" >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Box sx={{ backgroundColor: "Grey", borderRadius: "20px", height: "50px", width: "50px", fontSize: "10px", alignContent:"center" }}>UserName</Box>
                    <Box sx={{ backgroundColor: "red", borderRadius: "20px", height: "50px", width: "50px" }} />
                    <Box sx={{ backgroundColor: "red", borderRadius: "20px", height: "50px", width: "50px" }} />
                    <Box sx={{ backgroundColor: "red", borderRadius: "20px", height: "50px", width: "50px" }} />
                    <Box sx={{ backgroundColor: "red", borderRadius: "20px", height: "50px", width: "50px" }} />
                    <Box sx={{ backgroundColor: "red", borderRadius: "20px", height: "50px", width: "50px" }} />
                    <Box sx={{ backgroundColor: "red", borderRadius: "20px", height: "50px", width: "50px" }} />
                    <Box sx={{ backgroundColor: "red", borderRadius: "20px", height: "50px", width: "50px" }} />
                    <Box sx={{ backgroundColor: "red", borderRadius: "20px", height: "50px", width: "50px" }} />
                    <Box sx={{ backgroundColor: "red", borderRadius: "20px", height: "50px", width: "50px" }} />

                </Box>
            </Drawer>
        </>
    )
}