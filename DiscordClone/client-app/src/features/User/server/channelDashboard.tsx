import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useStore } from "../../../app/stores/store";
import { Box, Typography, Divider } from "@mui/material";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";

export default observer(function ChannelDashboard() {
    const { serverStore, channelStore } = useStore();
    const { serverId } = useParams();
    const navigate = useNavigate();
    useEffect(() => {
        serverStore.getServerApi(serverId!);
        channelStore.getChannelsApi(serverId!);
    }, [serverId,serverStore, channelStore]);
    const handleClick = (channelId: string) => {
        navigate('/server/' + serverId + '/' + channelId);
    }
    return (
        <Box display="flex" flexDirection="row" height="91vh" width="1474px" sx={{ backgroundColor: "#4E4E4E" }}>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                mt="20px"
                sx={{
                    backgroundColor: "#4E4E4E",
                    width: "250px", 
                    flexShrink: 0, 
                }}
            >
                <Typography variant="h6">
                    {serverStore.selectedServer?.name}
                </Typography>

                <Divider sx={{ width: '80%', borderColor: 'gray', my: 1 }} />

                {channelStore.channels.map((channel) => (
                    <Box
                        key={channel.channelId}
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        width="90%"
                        height="30px"
                        sx={{
                            backgroundColor: "#222222",
                            borderRadius: "15px",
                            mb: "10px",
                            '&:hover': {
                                backgroundColor: "#2A2A2A",
                                cursor: "pointer",
                            },
                        }}
                        onClick={()=>handleClick(channel.channelId) }
                    >
                     
                        <Typography variant="body1">
                            {channel.name}
                        </Typography>
                        
                    </Box>
                ))}
            </Box>

            <Box
                display="flex"
                sx={{
                    flexGrow: 1,
                    backgroundColor:"pink",
                    height:"100%"
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
});
