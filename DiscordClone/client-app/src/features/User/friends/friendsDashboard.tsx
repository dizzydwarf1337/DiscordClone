import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useStore } from "../../../app/stores/store";
import { Box, Typography, Divider } from "@mui/material";
import {  Outlet, useNavigate, useParams } from "react-router-dom";

export default observer(function ChannelDashboard() {
    const { userStore, friendStore } = useStore();
    const navigate = useNavigate();
    useEffect(() => {
        const loadFriends = async () => {
            friendStore.setFriends(await friendStore.GetUserFriendsById(userStore.user!.id));

            const groups = await friendStore.getFriendGroupsByUserId(userStore.user!.id);
            console.log("Friend groups fetched:", groups);  // Log the fetched groups
            friendStore.setFriendGroups(groups || []); 
        }
        loadFriends();
    }, [friendStore, userStore]);

    const handleClick = (friendId: string) => {
        navigate('/main/friend/' + friendId);
    }

    const handleCallClick = (friendId: string) => {
        alert(`Calling ${friendId}`);
    }
    return (
        <Box display="flex" flexDirection="row" height="91vh" width="96vw" sx={{ backgroundColor: "#4E4E4E" }}>
            {/* Left sidebar for friends */}
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                mt="20px"
                ml="16px"
                sx={{
                    backgroundColor: "#4E4E4E",
                    width: "17vw", // 20% of viewport width
                    flexShrink: 0,
                }}
            >
                <Typography variant="h6">Friends groups</Typography>
                <Divider sx={{ width: '80%', borderColor: 'gray', my: 1 }} />
                {friendStore.friendGroups?.length > 0 ? (
                friendStore.friendGroups.map((group) => (
                    <Box
                        key={group.id}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        width="85%"
                        height="40px"
                        sx={{
                            backgroundColor: "#333333",
                            borderRadius: "10px",
                            mb: "10px",
                            px: "12px",
                            '&:hover': {
                                backgroundColor: "#444444",
                                cursor: "pointer"
                            }
                        }}
                        onClick={() => navigate(`/main/group/${group.id}`)}
                    >
                        <Typography variant="body1" color="white">{group.name}</Typography>
                    </Box>
                ))
            ) : (
                <Typography variant="body2" color="gray">No groups yet</Typography>
            )}

                <Typography variant="h6">Friends</Typography>
                <Divider sx={{ width: '80%', borderColor: 'gray', my: 1 }} />

                {friendStore.friends ? (
                    friendStore.friends.map((friend) => (
                        <Box
                            key={friend.id}
                            display="flex"
                            gap="30px"
                            p="5px 10px 5px 10px"
                            alignItems="center"
                            width="85%"
                            height="45px"
                            sx={{
                                backgroundColor: "#222222",
                                borderRadius: "15px",
                                mb: "10px",
                                '&:hover': {
                                    backgroundColor: "#2A2A2A",
                                    cursor: "pointer",
                                },
                            }}
                            onClick={() => handleClick(friend.id)}
                        >
                            <Box display="flex" flexDirection="row" alignItems="center" justifyContent="space-between" width="100%" m="20px">
                                <Box
                                    display="flex"
                                    width="30px"
                                    height="30px"
                                    sx={{
                                        borderRadius: "50%",
                                        backgroundImage: friend.image ? `url(${friend.image})` : `url(/user.png)`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                    }}
                                />
                                <Typography ml="auto"
                                    mr="auto" variant="body1">{friend.username}</Typography>
                            </Box>
                            {/*<a onClick={(e) => { e.stopPropagation(); handleCallClick(friend.id); }}>Call</a>*/}
                        </Box>
                    ))
                ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" mt="20px">
                        <Typography variant="body1">No friends :(</Typography>
                    </Box>
                )}
            </Box>

            {/* Main content area */}
            <Box
                display="flex"
                sx={{
                    flexGrow: 1,
                    backgroundColor: "#1B1B1B", //#060018
                    height: "100%",
                    width: "80vw", // 80% of viewport width
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
});