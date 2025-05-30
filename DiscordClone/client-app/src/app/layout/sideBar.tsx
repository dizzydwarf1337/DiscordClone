import { useStore } from "../stores/store";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import JoinServerDialog from "../../features/User/server/joinServerDialog";
import FriendRequestsDialog from "../../features/User/friends/friendRequestsDialog";
import { Drawer, Box, Typography, Tooltip, Avatar, Badge } from "@mui/material";
import { CreateGroupDialog } from "../../features/User/groups/CreateGroupDialog";
import HomeIcon from '@mui/icons-material/Home';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddIcon from '@mui/icons-material/Add';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import DnsIcon from '@mui/icons-material/Dns';

export default observer(function SideBar() {
    const { userStore, serverStore, friendStore } = useStore();

    const [openServer, setOpenServer] = useState<boolean>(false);
    const [openFriends, setOpenFriends] = useState<boolean>(false);
    const [openCreateGroup, setOpenCreateGroup] = useState<boolean>(false);

    useEffect(() => {
        if (userStore.user && userStore.user.id && serverStore.servers.length === 0) {
            serverStore.getServersApi(userStore.user.id);
        }
    }, [userStore.user, serverStore]);

    const drawerWidth = 72;
    const navBarHeight = '48px';

    const commonButtonStyles = {
        width: 48,
        height: 48,
        mb: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backgroundColor: '#313338',
        color: '#dbdee1',
        borderRadius: '50%',
        transition: 'border-radius 0.15s ease-out, background-color 0.15s ease-out',
        '&:hover': {
            backgroundColor: '#5865f2',
            borderRadius: '16px',
            color: 'white',
        },
        overflow: 'hidden',
        textDecoration: 'none',
    };


    const getAvatarLetter = (name?: string) => (name?.[0] || 'S').toUpperCase();

    return (
        <>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        backgroundColor: '#202225',
                        borderRight: 'none',
                        overflowX: 'hidden',
                        alignItems: 'center',
                        top: navBarHeight,
                        height: `calc(100vh - ${navBarHeight})`,
                    },
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: "100%",
                        width: '100%',
                        alignItems: 'center',
                        pt: 1.5,
                    }} 
                    justifyContent="space-between"
                >
                    <Box display="flex" flexDirection="column" alignItems="center" width="100%">
                        <Tooltip title="Home / Friends" placement="right">
                            <Box
                                component={Link}
                                to={`/main`}
                                sx={{
                                    ...commonButtonStyles,
                                }}
                            >
                                {userStore.getUser()?.image ? (
                                    <Avatar src={userStore.getUser()!.image} sx={{ width: 48, height: 48, borderRadius: 'inherit' }} />
                                ) : (
                                    <HomeIcon sx={{ fontSize: 28 }} />
                                )}
                            </Box>
                        </Tooltip>

                        <Box sx={{ width: '32px', height: '2px', backgroundColor: '#35363c', my: 0.5, borderRadius: '1px' }} />


                        {serverStore.loading ? (null) :
                            (serverStore.servers?.map((server) => (
                                <Tooltip title={server.name} placement="right" key={server.serverId}>
                                    <Box
                                        component={Link}
                                        to={`/server/${server.serverId}`}
                                        sx={{
                                            ...commonButtonStyles,
                                            backgroundImage: server.iconUrl ? `url(${server.iconUrl})` : undefined,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                            color: server.iconUrl ? 'transparent' : '#dcddde',
                                        }}
                                    >
                                        {!server.iconUrl && (server.name ? getAvatarLetter(server.name) : <DnsIcon />)}
                                    </Box>
                                </Tooltip>
                            )))}

                        <Tooltip title="Add a Server" placement="right">
                            <Box
                                sx={{
                                    ...commonButtonStyles,
                                    backgroundColor: '#313338',
                                    '&:hover': {
                                        backgroundColor: '#23a559',
                                        borderRadius: '16px',
                                        color: 'white',
                                    },
                                }}
                                onClick={() => setOpenServer(true)}
                            >
                                <AddIcon sx={{ fontSize: 28 }} />
                            </Box>
                        </Tooltip>
                    </Box>

                    <Box display="flex" flexDirection="column" alignItems="center" width="100%" mb={1.5}>
                        <Tooltip title="Add Friends" placement="right">
                            <Box
                                sx={commonButtonStyles}
                                onClick={() => setOpenFriends(true)}
                            >
                                <Badge
                                    badgeContent={friendStore.friendRequests.length > 9 ? "9+" : friendStore.friendRequests.length}
                                    color="error"
                                    invisible={friendStore.friendRequests.length === 0}
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            minWidth: '16px',
                                            height: '16px',
                                            fontSize: '0.65rem',
                                            p: '0 4px',
                                            top: 4,
                                            right: 4,
                                        }
                                    }}
                                >
                                    <PersonAddIcon sx={{ fontSize: 28 }} />
                                </Badge>
                            </Box>
                        </Tooltip>

                        <Tooltip title="Create Group" placement="right">
                            <Box
                                sx={commonButtonStyles}
                                onClick={() => setOpenCreateGroup(true)}
                            >
                                <GroupAddIcon sx={{ fontSize: 28 }} />
                            </Box>
                        </Tooltip>
                    </Box>
                </Box>
            </Drawer>

            <JoinServerDialog open={openServer} onClose={() => setOpenServer(false)} />
            <FriendRequestsDialog open={openFriends} onClose={() => setOpenFriends(false)} />
            <CreateGroupDialog open={openCreateGroup} onClose={() => setOpenCreateGroup(false)} />
        </>
    );
});