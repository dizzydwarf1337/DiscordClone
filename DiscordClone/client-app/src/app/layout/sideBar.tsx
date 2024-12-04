import { Box, Drawer } from "@mui/material";
import { useStore } from "../stores/store";
import { Link } from "react-router-dom";

export default function SideBar() {
    const { userStore } = useStore();
    return (
        <>
            <Drawer variant="permanent" >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Link to={`/main`}>
                        <Box sx={{
                            borderRadius: "20px", height: "50px", width: "50px", fontSize: "10px", display: "flex",
                            alignItems: "center", justifyContent: "center", color:"white",
                            backgroundImage: `url(${userStore.getUser().image})`, backgroundSize: "cover", backgroundPosition: "center",
                         }}>
                                {userStore.user?.username}
                         </Box>
                    </Link>
                    <Link to={`/default`} >
                    <Box sx={{ backgroundColor: "red", borderRadius: "20px", height: "50px", width: "50px" }} >
                       
                        </Box>
                    </Link>
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