import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useStore } from "../../../app/stores/store";
import { Box, Typography, Divider, IconButton, Menu, MenuItem, ListItemIcon, Badge, Avatar } from "@mui/material";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CallIcon from '@mui/icons-material/Call';
import GroupManagementDialog from "../groups/groupManagmentDialog";
import { User } from "../../../app/Models/user";

export default observer(function FriendsDashboard() {
    const { userStore, friendStore, chatSignalRStore } = useStore();
    const navigate = useNavigate();
    const { friendId, groupId } = useParams();
    const [groupAnchorEl, setGroupAnchorEl] = useState<null | HTMLElement>(null);
    const [friendAnchorEl, setFriendAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedGroup, setSelectedGroup] = useState<{ id: string, name: string, isOwner: boolean, members: User[] } | null>(null);
    const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
    const groupMenuOpen = Boolean(groupAnchorEl);
    const friendMenuOpen = Boolean(friendAnchorEl);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

    const handleOpenEditDialog = () => { setGroupAnchorEl(null); setIsDialogOpen(true); };
    const closeDialog = () => setIsDialogOpen(false);
    const handleRefreshGroups = async () => { try { if (!userStore.user?.id) return; const groups = await friendStore.getFriendGroupsByUserId(userStore.user.id); friendStore.setFriendGroups(groups || []); const friends = await friendStore.GetUserFriendsById(userStore.user.id); friendStore.setFriends(friends || []); } catch (error) { /* console.error for debug if needed */ } };
    useEffect(() => { const loadFriendAndGroupData = async () => { if (!userStore.user?.id) return; await friendStore.setFriends(await friendStore.GetUserFriendsById(userStore.user.id)); const groups = await friendStore.getFriendGroupsByUserId(userStore.user.id); friendStore.setFriendGroups(groups || []); }; if (userStore.user?.id) { loadFriendAndGroupData(); } }, [userStore.user, friendStore]);
    useEffect(() => { const joinSignalRGroups = () => { if (chatSignalRStore.isConnected && friendStore.friendGroups && friendStore.friendGroups.length > 0) { friendStore.friendGroups.forEach((group: { id: string; }) => { chatSignalRStore.joinGroup(group.id); }); } }; if (userStore.user?.id && !chatSignalRStore.isConnected && !chatSignalRStore.isConnecting) { chatSignalRStore.startConnection(); } joinSignalRGroups(); }, [ chatSignalRStore.isConnected, chatSignalRStore.isConnecting, friendStore.friendGroups, userStore.user, chatSignalRStore ]);
    useEffect(() => { const markMessagesAsRead = async () => { if (friendId && userStore.user?.id) { await chatSignalRStore.markMessagesAsRead('private', friendId); } }; if (friendId && userStore.user?.id) markMessagesAsRead(); }, [friendId, chatSignalRStore, userStore.user]);
    useEffect(() => { const markGroupMessagesAsRead = async () => { if (groupId && userStore.user?.id) { await chatSignalRStore.markMessagesAsRead('group', groupId); } }; if (groupId && userStore.user?.id) markGroupMessagesAsRead(); }, [groupId, chatSignalRStore, userStore.user]);
    const handleClick = (id: string) => navigate('/main/friend/' + id);
    const handleGroupClick = (id: string) => navigate('/main/group/' + id);
    const handleGroupMenuClick = (event: React.MouseEvent<HTMLElement>, gId: string, name: string, isOwner: boolean, members: User[]) => { event.stopPropagation(); setSelectedGroup({ id: gId, name, isOwner, members }); setGroupAnchorEl(event.currentTarget); };
    const handleFriendMenuClick = (event: React.MouseEvent<HTMLElement>, friendUser: User) => { event.stopPropagation(); setSelectedFriend(friendUser); setFriendAnchorEl(event.currentTarget); };
    const handleCloseGroupMenu = () => setGroupAnchorEl(null);
    const handleCloseFriendMenu = () => setFriendAnchorEl(null);
    const handleDeleteGroup = async () => { if (selectedGroup && userStore.user?.id) { await friendStore.removeFriendGroup(selectedGroup.id); handleRefreshGroups(); handleCloseGroupMenu(); setSelectedGroup(null); } };
    const handleLeaveGroup = async () => { if (selectedGroup && userStore.user?.id) { await friendStore.leaveFromGroup(selectedGroup.id, userStore.user.id); handleRefreshGroups(); handleCloseGroupMenu(); setSelectedGroup(null); } };
    const handleRemoveFriend = async () => { if (selectedFriend && userStore.user?.id) { await friendStore.RemoveFriend(userStore.user.id, selectedFriend.id); handleRefreshGroups(); if (friendId === selectedFriend.id) navigate('/main'); handleCloseFriendMenu(); setSelectedFriend(null); } };
    const handleStartCall = () => { if (selectedFriend) {/* Call logic */ } handleCloseFriendMenu(); };
    const getUnreadFriendMessageCount = (id: string) => { if (!userStore.user?.id) return 0; const key = [userStore.user.id, id].sort().join("-"); return chatSignalRStore.unreadPrivateMessages.get(key) || 0; };
    const getUnreadGroupMessageCount = (id: string) => chatSignalRStore.unreadGroupMessages.get(id) || 0;
    const menuPaperStyles = { elevation: 0, overflow: 'visible', filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.2))', mt: 0.5, bgcolor: '#18191c', color: '#b9bbbe', borderRadius: '4px', minWidth: 180, '& .MuiMenuItem-root': { fontSize: '0.875rem', padding: '8px 12px', '&:hover': { backgroundColor: '#202225' } }, '& .MuiListItemIcon-root': { minWidth: '32px', color: 'inherit' }, '&:before': { content: '""', display: 'block', position: 'absolute', top: 0, right: 14, width: 10, height: 10, bgcolor: '#18191c', transform: 'translateY(-50%) rotate(45deg)', zIndex: 0, }, };

    return (
        <Box display="flex" flexDirection="row" height="100%" width="100%" sx={{ backgroundColor: "#2f3136" }}>
            {selectedGroup && ( <GroupManagementDialog isOpen={isDialogOpen && selectedGroup !== null} group={selectedGroup ?? { id: '', name: '', isOwner: false, members: [] }} onClose={closeDialog} onSave={handleRefreshGroups} /> )}
            
            <Box /* Left Sidebar for DMs and Groups */
                display="flex"
                flexDirection="column"
                sx={{
                    backgroundColor: "#2f3136", width: "240px", flexShrink: 0, height: '100%',
                    color: 'white', 
                    overflowX: 'hidden',
                    boxSizing: 'border-box',
                    borderRight: '1px solid rgba(0,0,0,0.2)'
                }}
            >
                {/* Header of DM/Group List */}
                <Box sx={{ p: "12px 16px", height: '49px', borderBottom: '1px solid rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', flexShrink: 0, boxSizing: 'border-box' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Direct Messages</Typography>
                </Box>
                
                {/* Scrollable Content of DM/Group List */}
                <Box sx={{ 
                    flexGrow: 1, 
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    p: '8px', 
                    boxSizing: 'border-box'
                }}>
                    <Typography variant="overline" sx={{ color: "#8e9297", fontWeight: '600', fontSize: '0.7rem', px: '10px', pt: '8px', pb: '4px', display: 'block' }}>
                        Friend groups
                    </Typography>
                    {friendStore.friendGroups && friendStore.friendGroups.length > 0 ? (
                        friendStore.friendGroups.map((group) => (
                            <Box /* Group Item Box */
                                key={group.id} display="flex" alignItems="center" justifyContent="space-between"
                                width="100%" p="6px 8px"
                                sx={{ borderRadius: "4px", mb: "2px", cursor: "pointer", backgroundColor: groupId === group.id ? '#404650' : 'transparent', color: groupId === group.id ? 'white' : '#8e9297', '&:hover': { backgroundColor: groupId === group.id ? '#404650' : "#3c3f46", color: 'white', }, boxSizing: 'border-box' }}
                                onClick={() => handleGroupClick(group.id)}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1, minWidth: 0 }}>{group.name}</Typography>
                                <Box display="flex" alignItems="center" sx={{flexShrink: 0}}>
                                    {getUnreadGroupMessageCount(group.id) > 0 && <Badge badgeContent={getUnreadGroupMessageCount(group.id)} color="error" sx={{ mr: '4px', '& .MuiBadge-badge': { fontSize: '0.65rem', height: '16px', minWidth: '16px', p: '0 4px' } }} />}
                                    <IconButton size="small" onClick={(e) => handleGroupMenuClick(e, group.id, group.name, group.creatorId === userStore.user?.id, group.members)} sx={{ color: 'inherit', p: '4px', '&:hover': { color: '#dcddde', backgroundColor: 'rgba(255,255,255,0.04)' } }} >
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        ))
                    ) : (<Typography variant="caption" sx={{ color: "#8e9297", display: 'block', textAlign: 'center', p: '10px' }}>No groups yet</Typography>)}

                    <Typography variant="overline" sx={{ color: "#8e9297", fontWeight: '600', fontSize: '0.7rem', px: '10px', pb: '4px', pt: '16px', mt: 1, display: 'block' }}>
                        Friends
                    </Typography>
                    {friendStore.friends && friendStore.friends.length > 0 ? (
                        friendStore.friends.map((friend) => (
                            <Box /* Friend Item Box */
                                key={friend.id} p="6px 8px" alignItems="center" width="100%" display="flex" justifyContent="space-between"
                                sx={{ borderRadius: "4px", mb: "2px", cursor: "pointer", backgroundColor: friendId === friend.id ? '#404650' : 'transparent', color: friendId === friend.id ? 'white' : '#8e9297', '&:hover': { backgroundColor: friendId === friend.id ? '#404650' : "#3c3f46", color: 'white', }, boxSizing: 'border-box'}}
                                onClick={() => handleClick(friend.id)}
                            >
                                <Box display="flex" alignItems="center" gap="12px" sx={{ overflow: 'hidden', flexGrow: 1, minWidth: 0 }}>
                                    <Box display="flex" width="32px" height="32px" sx={{ borderRadius: "50%", backgroundImage: `url(${friend.image || '/user.png'})`, backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{friend.username}</Typography>
                                </Box>
                                <Box display="flex" alignItems="center" sx={{flexShrink: 0}}>
                                    {getUnreadFriendMessageCount(friend.id) > 0 && <Badge badgeContent={getUnreadFriendMessageCount(friend.id)} color="error" sx={{ mr: '4px', '& .MuiBadge-badge': { fontSize: '0.65rem', height: '16px', minWidth: '16px', p: '0 4px' } }} />}
                                    <IconButton size="small" onClick={(e) => handleFriendMenuClick(e, friend)} sx={{ color: 'inherit', p: '4px', '&:hover': { color: '#dcddde', backgroundColor: 'rgba(255,255,255,0.04)' } }}>
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        ))
                    ) : (<Typography variant="caption" sx={{ color: "#8e9297", display: 'block', textAlign: 'center', p: '10px' }}>No friends :(</Typography>)}
                </Box>
            </Box>

            <Menu anchorEl={groupAnchorEl} open={groupMenuOpen} onClose={handleCloseGroupMenu} onClick={(e) => e.stopPropagation()} PaperProps={{ sx: menuPaperStyles }} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                {selectedGroup?.isOwner ? ([<MenuItem key="edit" onClick={handleOpenEditDialog}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Edit</MenuItem>, <MenuItem key="delete" onClick={handleDeleteGroup} sx={{ color: '#f04747', '&:hover': { color: '#f04747', backgroundColor: 'rgba(240,71,71,0.1)' } }}><ListItemIcon sx={{ color: 'inherit' }}><DeleteIcon fontSize="small" /></ListItemIcon>Delete</MenuItem>]) : (<MenuItem key="leave" onClick={handleLeaveGroup} sx={{ color: '#f04747', '&:hover': { color: '#f04747', backgroundColor: 'rgba(240,71,71,0.1)' } }}><ListItemIcon sx={{ color: 'inherit' }}><ExitToAppIcon fontSize="small" /></ListItemIcon>Leave group</MenuItem>)}
            </Menu>
            <Menu anchorEl={friendAnchorEl} open={friendMenuOpen} onClose={handleCloseFriendMenu} onClick={(e) => e.stopPropagation()} PaperProps={{ sx: menuPaperStyles }} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                <MenuItem onClick={handleStartCall}><ListItemIcon><CallIcon fontSize="small" /></ListItemIcon>Call</MenuItem>
                <MenuItem onClick={handleRemoveFriend} sx={{ color: '#f04747', '&:hover': { color: '#f04747', backgroundColor: 'rgba(240,71,71,0.1)' } }}><ListItemIcon sx={{ color: 'inherit' }}><DeleteIcon fontSize="small" /></ListItemIcon>Remove Friend</MenuItem>
            </Menu>

            <Box
                display="flex"
                flexDirection="column"
                sx={{ flexGrow: 1, backgroundColor: "#36393f", height: "100%", overflow: 'hidden' }}
            >
                <Outlet />
            </Box>
        </Box>
    );
});