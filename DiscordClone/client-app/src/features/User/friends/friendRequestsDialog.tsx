import { Box, Button, Dialog, IconButton, TextField, Typography } from "@mui/material";
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault';
import { useStore } from "../../../app/stores/store";
import FriendsUsernameRequest from "../../../app/Models/FriendsUsernameRequest";


interface Props{
    open: boolean;
    onClose: () => void;
}

export default observer(function FriendRequestsDialog({ open, onClose }: Props) {

    const [requests, setRequests] = useState<boolean>(true);
    const { friendStore, userStore } = useStore();
    const [friendsUsernameRequest, setFriendsUserNameRequest] = useState<FriendsUsernameRequest>({ senderId: userStore.user!.id, userName: "" });
    useEffect(() => {  
        const loadData = async () => {
            var friendsRequests = await friendStore.GetUserFriendRequestsById(userStore.user?.id);
            console.log(userStore.user.id); 
            var userFriends = await friendStore.GetUserFriendsById(userStore.user!.id);
            friendStore.setFriendsRequests(friendsRequests);
            friendStore.setFriends(userFriends);
        }
        loadData();
    }, [friendStore, userStore]);
    return (
        <>
            <Dialog open={open} onClose={onClose}>
                <Box display="flex" flexDirection="column" p="10px" width="300px" height={requests?("400px") : ("200")} justifyContent="flex-start" alignItems="center">
                    <Box display="flex" flexDirection="row" gap="30px" justifyContent="center" alignItems="center">
                        <Box display="flex" justifyContent="center" alignItems="center" sx={{ cursor: "pointer" }} onClick={() => (setRequests(true))}>
                            <Typography variant="h6" sx={{ color: requests ? "green" : "1primary", transition:"0.3s ease"}}>Friend Requests</Typography>
                        </Box>
                        <Box display="flex" justifyContent="center" alignItems="center" sx={{ cursor: "pointer" }} onClick={() => (setRequests(false))}>
                            <Typography variant="h6" sx={{ color: requests ? "primary" : "green", transition: "0.3s ease" }}>Add Friend</Typography>
                        </Box>
                    </Box>
                    {requests ? (
                        <Box>
                            {friendStore.friendRequests.length > 0 ? (
                                friendStore.friendRequests.map((friendRequest) => (
                                    <Box display="flex" flexDirection="row" width="100%" gap="60px" mt="20px" alignItems="center">
                                        <Box display="flex" justifyContent="center" alignItems="center" sx={{
                                            width: "30px", height: "30px",
                                            borderRadius: "50%",
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            backgroundImage: friendRequest.image ? (`url(${friendRequest.image})`) : (`url(/user.png)`),
                                        }} />
                                        <Box display="flex" justifyContent="center" alignItems="center" key={friendRequest.requestId}>
                                            <Typography variant="body1">{friendRequest.userName}</Typography>
                                        </Box>
                                        <Box display="flex" flexDirection="row" gap="10px">
                                            <IconButton onClick={async () => { await friendStore.AcceptFriendRequest(friendRequest); friendStore.friendRequests.filter(x => x.requestId == friendRequest.requestId); onClose(); }}>
                                                <CheckCircleIcon sx={{ color: "#5EB34D" }} />
                                            </IconButton>
                                            <IconButton onClick={async () => { await friendStore.RejectFriendRequest(friendRequest); friendStore.friendRequests.filter(x => x.requestId == friendRequest.requestId); onClose(); }}>
                                                <DisabledByDefaultIcon sx={{ color: "#BF3E3E" }} />
                                            </IconButton>
                                        </Box>
                                        
                                    </Box>
                                ))
                            ) : (
                                <Box display="flex" justifyContent="center" alignItems="center" mt="20px">
                                    <Typography variant="body1">No friend requests</Typography>
                                </Box>
                            )}
                        </Box>
                    ) : (
                            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" p="20px" gap="20px">
                                <TextField label="UserName" value={friendsUsernameRequest.userName} onChange={(e) => setFriendsUserNameRequest({ ...friendsUsernameRequest, userName: e.target.value })} />
                                <Button onClick={async () => { await friendStore.SendFriendRequestUserName(friendsUsernameRequest); console.log(friendsUsernameRequest); onClose(); }} variant="contained" color="success">Send request</Button>

                        </Box>
                        ) 
                    }
                </Box>
            </Dialog>
        </>
    )
})
