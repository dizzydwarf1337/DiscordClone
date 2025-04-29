import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useStore } from "../../../app/stores/store";
import { Box, Typography, Divider, IconButton, Menu, MenuItem, ListItemIcon, Badge } from "@mui/material";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import GroupManagementDialog from "../groups/groupManagmentDialog";
import { User } from "../../../app/Models/user";

export default observer(function ChannelDashboard() {
    const { userStore, friendStore, signalRStore } = useStore();
    const navigate = useNavigate();
    const { friendId, groupId } = useParams();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedGroup, setSelectedGroup] = useState<{ id: string, name: string, isOwner: boolean, members: User[] } | null>(null);
    const open = Boolean(anchorEl);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    
    const handleOpenEditDialog = () => {
        setAnchorEl(null);
        setIsDialogOpen(true);
    }
    const closeDialog = () => setIsDialogOpen(false);

    const handleRefreshGroups = async () => {
        try {
            const groups = await friendStore.getFriendGroupsByUserId(userStore.user!.id);
            friendStore.setFriendGroups(groups || []);
            
            const friends = await friendStore.GetUserFriendsById(userStore.user!.id);
            friendStore.setFriends(friends || []);
            
            console.log("Groups and friends refreshed");
        } catch (error) {
            console.error("Failed to refresh groups and friends:", error);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            await friendStore.setFriends(await friendStore.GetUserFriendsById(userStore.user!.id));
            const groups = await friendStore.getFriendGroupsByUserId(userStore.user!.id);
            friendStore.setFriendGroups(groups || []);
            
            if (signalRStore.connection) {
                groups?.forEach((group: { id: string; }) => {
                    signalRStore.joinGroup(group.id);
                });
            }
        };
        
        loadInitialData();
    }, []);

    useEffect(() => {
        const markMessagesAsRead = async () => {
            if (friendId) {
                const key = [userStore.user?.id, friendId].sort().join("-");
                await signalRStore.markMessagesAsRead('private', key);
            }
        };
        markMessagesAsRead();
    }, [friendId, userStore.user?.id, signalRStore]);

    useEffect(() => {
        const markGroupMessagesAsRead = async () => {
            if (groupId) {
                await signalRStore.markMessagesAsRead('group', groupId);
            }
        };
        markGroupMessagesAsRead();
    }, [groupId, signalRStore]);

    const handleClick = (friendId: string) => {
        navigate('/main/friend/' + friendId);
    };

    const handleGroupClick = (groupId: string) => {
        navigate('/main/group/' + groupId);
    };

    const handleGroupMenuClick = (event: React.MouseEvent<HTMLElement>, groupId: string, name: string, isOwner: boolean, members: User[]) => {
        event.stopPropagation();
        setSelectedGroup({ id: groupId, name, isOwner, members});
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setSelectedGroup(null);
    };

    const handleDeleteGroup = async () => {
        if (selectedGroup) {
            try {
                await friendStore.removeFriendGroup(selectedGroup.id);
                const groups = await friendStore.getFriendGroupsByUserId(userStore.user!.id);
                friendStore.setFriendGroups(groups || []);
            } catch (error) {
                console.error("Failed to delete group:", error);
            }
            handleClose();
        }
    };

    const handleLeaveGroup = async () => {
        if (selectedGroup && userStore.user) {
            try {
                await friendStore.leaveFromGroup(selectedGroup.id, userStore.user.id);
                const groups = await friendStore.getFriendGroupsByUserId(userStore.user.id);
                friendStore.setFriendGroups(groups || []);
            } catch (error) {
                console.error("Failed to leave group:", error);
            }
            handleClose();
        }
    };

    const getUnreadFriendMessageCount = (friendId: string) => {
        if (!userStore.user) return 0;
        const key = [userStore.user.id, friendId].sort().join("-");
        return signalRStore.unreadPrivateMessages.get(key) || 0;
    };

    const getUnreadGroupMessageCount = (groupId: string) => {
        return signalRStore.unreadGroupMessages.get(groupId) || 0;
    };

    return (
        <Box display="flex" flexDirection="row" height="91vh" width="96vw" sx={{ backgroundColor: "#4E4E4E" }}>

            <GroupManagementDialog
                isOpen={isDialogOpen && selectedGroup !== null}
                group={selectedGroup ?? { id: '', name: '', isOwner: false, members: [] }}
                onClose={closeDialog}
                onSave={handleRefreshGroups}
            />
            {/* Left sidebar for friends */}
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                mt="20px"
                ml="16px"
                sx={{
                    backgroundColor: "#4E4E4E",
                    width: "17vw",
                    flexShrink: 0,
                }}
            >
                <Typography variant="h6">Friend groups</Typography>
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
                            onClick={() => handleGroupClick(group.id)}
                        >
                            <Badge 
                                badgeContent={getUnreadGroupMessageCount(group.id)} 
                                color="error"
                                sx={{ 
                                    '& .MuiBadge-badge': { 
                                        fontSize: '0.7rem',
                                        height: '18px',
                                        minWidth: '18px'
                                    } 
                                }}
                            >
                                <Typography variant="body1" color="white">{group.name}</Typography>
                            </Badge>
                            <IconButton
                                size="small"
                                onClick={(e) => handleGroupMenuClick(e, group.id, group.name, group.creatorId === userStore.user?.id, group.members)}
                                sx={{ color: 'white' }}
                            >
                                <MoreVertIcon fontSize="small" />
                            </IconButton>
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
                                        backgroundImage: `url(${friend.image || '/user.png'})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                    }}
                                />
                                <Badge 
                                    badgeContent={getUnreadFriendMessageCount(friend.id)} 
                                    color="error"
                                    sx={{ 
                                        '& .MuiBadge-badge': { 
                                            fontSize: '0.7rem',
                                            height: '18px',
                                            minWidth: '18px'
                                        } 
                                    }}
                                >
                                    <Typography ml="auto" mr="auto" variant="body1">{friend.username}</Typography>
                                </Badge>
                            </Box>
                        </Box>
                    ))
                ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" mt="20px">
                        <Typography variant="body1">No friends :(</Typography>
                    </Box>
                )}
            </Box>

            {/* Group management menu */}
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={(e) => e.stopPropagation()}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                        '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {selectedGroup?.isOwner ? (
                    [
                        <MenuItem key="edit" onClick={handleOpenEditDialog}>
                            <ListItemIcon>
                                <EditIcon fontSize="small" />
                            </ListItemIcon>
                            Edit
                        </MenuItem>,
                        <MenuItem key="delete" onClick={handleDeleteGroup}>
                            <ListItemIcon>
                                <DeleteIcon fontSize="small" />
                            </ListItemIcon>
                            Delete
                        </MenuItem>
                    ]
                ) : (
                    <MenuItem key="leave" onClick={handleLeaveGroup}>
                        <ListItemIcon>
                            <ExitToAppIcon fontSize="small" />
                        </ListItemIcon>
                        Leave group
                    </MenuItem>
                )}
            </Menu>

            {/* Main content area */}
            <Box
                display="flex"
                sx={{
                    flexGrow: 1,
                    backgroundColor: "#1B1B1B",
                    height: "100%",
                    width: "80vw",
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
});