import { Box, Drawer } from "@mui/material";

export default function SideBar() {
    return (
        <>
            <Drawer variant="permanent" hideBackdrop={true}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Box sx={{ backgroundColor: "red", borderRadius: "20px", height: "50px", width: "50px" }} />
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