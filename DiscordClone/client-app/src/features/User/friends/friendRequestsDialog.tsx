import React from "react";
import { observer } from "mobx-react-lite";
import { Box, Button, Dialog, IconButton, TextField, Typography, Avatar, Divider } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault';
import { useStore } from "../../../app/stores/store";
import FriendsUsernameRequest from "../../../app/Models/FriendsUsernameRequest";
import { useEffect, useState } from "react";
import { User } from "../../../app/Models/user";

interface Props {
    open: boolean;
    onClose: () => void;
}

export default observer(function FriendRequestsDialog({ open, onClose }: Props) {
    const [requests, setRequests] = useState<boolean>(true);
    const { friendStore, userStore } = useStore();

    const initialSenderId = userStore.user?.id || "";
    const [friendsUsernameRequest, setFriendsUserNameRequest] = useState<FriendsUsernameRequest>({
        senderId: initialSenderId,
        userName: ""
    });

    useEffect(() => {
        if (userStore.user?.id && userStore.user.id !== friendsUsernameRequest.senderId) {
            setFriendsUserNameRequest(prev => ({ ...prev, senderId: userStore.user!.id }));
        } else if (!userStore.user?.id && friendsUsernameRequest.senderId !== "") {
            setFriendsUserNameRequest(prev => ({ ...prev, senderId: "" }));
        }
    }, [userStore.user, friendsUsernameRequest.senderId]);


    useEffect(() => {
        const loadData = async () => {
            if (!userStore.user?.id) {
                friendStore.setFriendsRequests([]);
                friendStore.setFriends([]);
                return;
            }
            try {
                var friendsRequests = await friendStore.GetUserFriendRequestsById(userStore.user.id);
                var userFriends = await friendStore.GetUserFriendsById(userStore.user.id);
                friendStore.setFriendsRequests(friendsRequests || []);
                friendStore.setFriends(userFriends || []);
            } catch (error) {
                console.error("Error loading data in FriendRequestsDialog:", error);
                friendStore.setFriendsRequests([]);
                friendStore.setFriends([]);
            }
        };

        if (open) {
            loadData();
        }
    }, [open, userStore.user?.id, friendStore]);

    const activeTextColor = '#f2f3f5';
    const inactiveTextColor = '#b9bbbe';
    const activeIndicatorColor = '#5865f2';

    const handleActualSendFriendRequest = async () => {
        if (!userStore.user?.id) {
            console.error("Cannot send friend request: User not logged in.");
            onClose();
            return;
        }
        const payloadToSend = {
            ...friendsUsernameRequest,
            senderId: userStore.user.id
        };
        await friendStore.SendFriendRequestUserName(payloadToSend);
        onClose();
    };

    const handleActualAcceptFriendRequest = async (friendRequest: any) => {
        if (!userStore.user?.id) return;
        await friendStore.AcceptFriendRequest(friendRequest);
        if (open) {
            if (!userStore.user?.id) return;
            var fr = await friendStore.GetUserFriendRequestsById(userStore.user.id);
            friendStore.setFriendsRequests(fr || []);
        }
    };

    const handleActualRejectFriendRequest = async (friendRequest: any) => {
        if (!userStore.user?.id) return;
        await friendStore.RejectFriendRequest(friendRequest);
        if (open) {
            if (!userStore.user?.id) return;
            var fr = await friendStore.GetUserFriendRequestsById(userStore.user.id);
            friendStore.setFriendsRequests(fr || []);
        }
    };


    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: {
                        bgcolor: '#313338', color: '#dcddde', borderRadius: '5px',
                        width: '440px', maxWidth: '90vw',
                        minHeight: requests ? '300px' : '290px',
                        maxHeight: 'calc(100vh - 40px)',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 0 0 1px rgba(18,19,20,0.3), 0 2px 10px 0 rgba(18,19,20,0.2)',
                        overflow: 'hidden'
                    }
                }}
            >
                <Box
                    display="flex" flexDirection="column" width="100%"
                    justifyContent="flex-start" alignItems="center"
                    sx={{ flexGrow: 1, overflow: 'hidden' }}
                >
                    <Box
                        display="flex" flexDirection="row" justifyContent="center" alignItems="center"
                        sx={{ width: '100%', p: '16px 20px 0px 20px', borderBottom: '1px solid #3f4147', flexShrink: 0 }}
                    >
                        <Box sx={{ cursor: "pointer", p: '8px 16px', borderBottom: requests ? `2px solid ${activeIndicatorColor}` : '2px solid transparent', mb: '-1px' }} onClick={() => (setRequests(true))}>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: requests ? activeTextColor : inactiveTextColor, transition: "color 0.15s ease" }}>Friend Requests</Typography>
                        </Box>
                        <Box sx={{ cursor: "pointer", p: '8px 16px', borderBottom: !requests ? `2px solid ${activeIndicatorColor}` : '2px solid transparent', mb: '-1px' }} onClick={() => (setRequests(false))}>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: requests ? inactiveTextColor : activeTextColor, transition: "color 0.15s ease" }}>Add Friend</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ width: '100%', flexGrow: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
                        {requests ? (
                            <Box sx={{ p: '16px 20px' }}>
                                {friendStore.friendRequests.length > 0 ? (
                                    friendStore.friendRequests.map((friendRequest) => (
                                        <Box
                                            key={friendRequest.requestId} display="flex" flexDirection="row" width="100%"
                                            alignItems="center" justifyContent="space-between"
                                            sx={{ p: '8px 0px', borderBottom: '1px solid #3f4147', '&:last-child': { borderBottom: 'none' } }}
                                        >
                                            <Box display="flex" alignItems="center" gap="12px">
                                                <Box sx={{ width: "32px", height: "32px", borderRadius: "50%", backgroundSize: "cover", backgroundPosition: "center", backgroundImage: friendRequest.image ? (`url(${friendRequest.image})`) : (`url(/user.png)`), flexShrink: 0 }} />
                                                <Typography variant="body1" sx={{ color: '#f2f3f5', fontWeight: 500 }}>{friendRequest.userName}</Typography>
                                            </Box>
                                            <Box display="flex" flexDirection="row" gap="8px">
                                                <IconButton onClick={() => handleActualAcceptFriendRequest(friendRequest)} size="small" sx={{ p: '6px', backgroundColor: 'rgba(79,170,101,0.1)', '&:hover': { backgroundColor: 'rgba(79,170,101,0.2)' } }}><CheckCircleIcon sx={{ color: "#4faa65" }} /></IconButton>
                                                <IconButton onClick={() => handleActualRejectFriendRequest(friendRequest)} size="small" sx={{ p: '6px', backgroundColor: 'rgba(240,71,71,0.1)', '&:hover': { backgroundColor: 'rgba(240,71,71,0.2)' } }}><DisabledByDefaultIcon sx={{ color: "#f04747" }} /></IconButton>
                                            </Box>
                                        </Box>
                                    ))
                                ) : (
                                    <Box display="flex" justifyContent="center" alignItems="center" sx={{ color: '#8e9297', textAlign: 'center', pt: 4, pb: 2 }}>
                                        <Typography variant="body2">No pending friend requests.</Typography>
                                    </Box>
                                )}
                            </Box>
                        ) : (
                            <Box
                                display="flex" flexDirection="column" gap="16px"
                                sx={{ p: '24px 20px 20px 20px', boxSizing: 'border-box' }}
                            >
                                <Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#f2f3f5', mb: '2px', textTransform: 'uppercase' }}>ADD FRIEND</Typography>
                                    <Typography sx={{ fontSize: '12px', color: '#b9bbbe' }}>You can add a friend with their username.</Typography>
                                </Box>
                                <TextField
                                    fullWidth placeholder="Enter a Username"
                                    value={friendsUsernameRequest.userName}
                                    onChange={(e) => setFriendsUserNameRequest({ ...friendsUsernameRequest, userName: e.target.value })}
                                    variant="filled"
                                    InputProps={{ disableUnderline: true, sx: { backgroundColor: '#1e1f22', color: '#dcddde', borderRadius: '3px', fontSize: '1rem', height: '40px', '& input': { padding: '10px 12px', boxSizing: 'border-box' }, border: '1px solid #1e1f22', '&:hover': { borderColor: '#060607' }, '&.Mui-focused': { borderColor: '#000000' }, '&.Mui-error .MuiFilledInput-input': { borderColor: 'transparent' }, '&.Mui-error': { backgroundColor: 'rgba(250,71,71,0.05)', borderColor: 'rgba(240,71,71,0.5)' } } }}
                                    InputLabelProps={{ shrink: false, sx: { display: 'none' } }}
                                />
                                <Box display="flex" justifyContent="center">
                                    <Button
                                        onClick={handleActualSendFriendRequest}
                                        variant="contained"
                                        disabled={!friendsUsernameRequest.userName.trim()}
                                        sx={{ bgcolor: '#5865f2', color: 'white', fontWeight: 500, fontSize: '0.875rem', padding: '6px 16px', textTransform: 'none', lineHeight: '1.3', minHeight: '32px', textAlign: 'center', width: 'auto', '&:hover': { bgcolor: '#4752c4' } }}
                                    >
                                        Send Friend Request
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Dialog>
        </>
    )
})