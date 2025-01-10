import { Box, Button, Checkbox, Dialog, Drawer, TextField, Typography } from "@mui/material";
import { useStore } from "../stores/store";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { ServerCreateDto } from "../Models/ServerCreate";
import SignalRStore from "../stores/SignalRStore";

export default observer(function SideBar() {
    const { userStore, serverStore, signalRStore } = useStore();
    
    const [open, setOpen] = useState<boolean>(false);
    const [join, setJoin] = useState<boolean>(true);
    const [joinServerId, setJoinServerId] = useState<string>("");
    const [serverCreate, setServerCreate] = useState<ServerCreateDto>({
        ownerId: userStore.user!.id,
        name: "",
        description: "",
        iconUrl: "",
        isPublic: true,
    });

    const handleClose = () => setOpen(false);
    const handleJoin = async () => {
        await serverStore.joinServerApi(userStore.user.id, joinServerId);
        await signalRStore.joinChannel(serverStore.servers.find(x => x.serverId === joinServerId)!.name, "Default");
        await serverStore.getServersApi(userStore.user!.id);
        setOpen(false);
    };
    const handleCreate = async () => {
        await serverStore.createServerApi(serverCreate);
        setOpen(false);
    };

    useEffect(() => {
        if (serverStore.servers.length === 0)
            serverStore.getServersApi(userStore.user!.id).then(response => console.log(response));

    }, [userStore,serverStore]);


    return (
        <>
            <Drawer variant="permanent">
                <Box sx={{ display: 'flex', flexDirection: 'column', height: "95%" }} justifyContent="space-between">
                    <Box display="flex" flexDirection="column" gap="10px">
                        <Link to={`/main`}>
                            <Box sx={{
                                borderRadius: "20px", height: "50px", width: "50px", fontSize: "10px", display: "flex",
                                alignItems: "center", justifyContent: "center", color: "white",
                                backgroundImage: `url(${userStore.getUser()!.image})`, backgroundSize: "cover", backgroundPosition: "center",
                            }}>
                                {userStore.user?.username}
                            </Box>
                        </Link>

                        {serverStore.loading ? (null) :
                            (serverStore.servers?.map((server) => (
                                <Link to={`/server/${server.serverId}`} style={{ textDecoration: "none", textAlign: "center" }} key={server.serverId}>
                                    <Box sx={{
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        height: "50px", width: "50px", fontSize: "10px", color: "black",
                                        cursor: "pointer", backgroundColor: "lightgray", borderRadius: "20px",
                                    }}>
                                        {server.name}
                                    </Box>
                                </Link>
                            )))}
                    </Box>
                    <Box display="flex" flexDirection="column" gap="10px">
                        <Box sx={{
                            borderRadius: "20px", height: "50px", width: "50px", fontSize: "10px", display: "flex",
                            alignItems: "center", justifyContent: "center", color: "black",
                            cursor: "pointer", backgroundColor: "lightgray",
                        }}>
                            Add Friend
                        </Box>
                        <Box sx={{
                            borderRadius: "20px", height: "50px", width: "50px", fontSize: "10px", display: "flex",
                            alignItems: "center", justifyContent: "center", color: "black",
                            cursor: "pointer", backgroundColor: "lightgray",
                        }}
                            onClick={() => setOpen(true)}
                        >
                            Add Server
                        </Box>
                    </Box>
                </Box>
            </Drawer>

            <Dialog open={open} onClose={handleClose}>
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" width="300px" height={join ? "300px" : "400px"}>
                    {join ? (
                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p="10px 20px" gap="20px">
                            <Typography variant="h6" alignSelf="center">Join Server</Typography>
                            <TextField label="Server Id" value={joinServerId} onChange={(e) => setJoinServerId(e.target.value)} />
                            <Button variant="contained" color="success" onClick={handleJoin}>Join</Button>
                            <Box
                                sx={{ cursor: "pointer" }}
                                onClick={() => setJoin(false)}
                            >
                                <Typography variant="body2" >Want to create server?</Typography>
                            </Box>
                        </Box>
                    ) : (
                        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p="10px 20px" gap="20px">
                            <Typography variant="h6" alignSelf="center">Create Server</Typography>
                            <TextField label="Server Name*" value={serverCreate.name} onChange={(e) => setServerCreate({ ...serverCreate, name: e.target.value })} />
                            <TextField label="Server Description" value={serverCreate.description} onChange={(e) => setServerCreate({ ...serverCreate, description: e.target.value })} />
                            <Box display="flex" alignItems="center" justifyItems="center">
                                <Typography variant="body2">Is public?</Typography>
                                <Checkbox checked={serverCreate.isPublic} color="success" onChange={(e) => setServerCreate({ ...serverCreate, isPublic: e.target.checked })} />
                            </Box>
                            <Button variant="contained" color="success" onClick={handleCreate}>Create Server</Button>
                            <Box
                                sx={{ cursor: "pointer" }}
                                onClick={() => setJoin(true)}
                            >
                                <Typography variant="body2" >Join server instead</Typography>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Dialog>
        </>
    );
});
