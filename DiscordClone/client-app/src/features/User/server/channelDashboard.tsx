import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useStore } from "../../../app/stores/store";
import { Box, Typography, IconButton, Avatar } from "@mui/material";
import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";
import ServerMembers from "./serverMembers";
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import TagIcon from '@mui/icons-material/Tag';
import AddIcon from '@mui/icons-material/Add';
import { Channel } from '../../../app/Models/Channel';
import { runInAction } from "mobx";
import AddChannelDialog from "./AddChannelDialog";
import { VoiceUserDto } from "../../../app/Models/VoiceUserDto";

export type ChannelDashboardOutletContextType = {
    isServerMembersOpen: boolean;
    toggleServerMembers: () => void;
};

export default observer(function ChannelDashboard() {
    const { serverStore, channelStore, voiceSignalRStore, userStore } = useStore();
    const params = useParams<{ serverId: string; channelIdParam: string }>();
    const serverId = params.serverId!;
    const channelIdParamFromUrl = params.channelIdParam;

    const navigate = useNavigate();
    const location = useLocation();
    const [sideBarOpen, setSideBarOpen] = useState<boolean>(false);
    const [addChannelDialogOpen, setAddChannelDialogOpen] = useState(false);
    const [defaultChannelTypeForDialog, setDefaultChannelTypeForDialog] = useState<'text' | 'voice'>('text');

    useEffect(() => {
        if (serverId) {
            serverStore.getServerApi(serverId);
            serverStore.fetchServerMembers(serverId);
            channelStore.getChannelsApi(serverId).then(() => {
                runInAction(() => {
                    let targetTextChannelIdForUrl: string | null = null;
                    const channelFromUrl = channelStore.channels.find(c => c.channelId === channelIdParamFromUrl);
                    if (channelFromUrl && channelFromUrl.channelType === 'text') {
                        targetTextChannelIdForUrl = channelFromUrl.channelId;
                        if (channelStore.lastActiveTextChannelId !== channelFromUrl.channelId) {
                            channelStore.setLastActiveTextChannelId(channelFromUrl.channelId);
                        }
                    } else if (channelStore.lastActiveTextChannelId) {
                        targetTextChannelIdForUrl = channelStore.lastActiveTextChannelId;
                    } else {
                        targetTextChannelIdForUrl = channelStore.getFirstTextChannelId();
                        if (targetTextChannelIdForUrl) {
                            channelStore.setLastActiveTextChannelId(targetTextChannelIdForUrl);
                        }
                    }
                    if (targetTextChannelIdForUrl && targetTextChannelIdForUrl !== channelIdParamFromUrl) {
                        navigate(`/server/${serverId}/${targetTextChannelIdForUrl}`, { replace: true });
                    } else if (!targetTextChannelIdForUrl && channelIdParamFromUrl) {
                        const currentRouteIsText = channelStore.channels.some(c => c.channelId === channelIdParamFromUrl && c.channelType === 'text');
                        if (currentRouteIsText) {
                            navigate(`/server/${serverId}`, { replace: true });
                        }
                    }
                });
            });
        }
    }, [serverId, channelStore, navigate, serverStore, channelIdParamFromUrl, location.pathname]);

    useEffect(() => {
        if (serverId && channelStore.lastActiveTextChannelId && channelStore.lastActiveTextChannelId !== channelIdParamFromUrl) {
            const isNavigatingToValidTextChannel = channelStore.channels.some(c => c.channelId === channelStore.lastActiveTextChannelId && c.channelType === 'text');
            if (isNavigatingToValidTextChannel) {
                navigate(`/server/${serverId}/${channelStore.lastActiveTextChannelId}`, { replace: true });
            }
        }
    }, [channelStore.lastActiveTextChannelId, serverId, channelIdParamFromUrl, navigate, channelStore.channels]);

    useEffect(() => {
        if (!voiceSignalRStore.isConnected && !voiceSignalRStore.isConnecting) {
            voiceSignalRStore.startConnection();
        }
    }, [voiceSignalRStore]);

    const handleOpenAddChannelDialog = (type: 'text' | 'voice') => { setDefaultChannelTypeForDialog(type); setAddChannelDialogOpen(true); };
    const handleCloseAddChannelDialog = () => { setAddChannelDialogOpen(false); };
    const handleChannelClick = (channel: Channel) => { if (channel.channelType === 'text') { if (channel.channelId !== channelIdParamFromUrl) { channelStore.setLastActiveTextChannelId(channel.channelId); } } else if (channel.channelType === 'voice') { if (userStore.user) { if (voiceSignalRStore.currentVoiceChannelId !== channel.channelId) { if (voiceSignalRStore.currentVoiceChannelId) { voiceSignalRStore.leaveVoiceChannel(); } voiceSignalRStore.joinVoiceChannel(channel.channelId, userStore.user.username || "User"); } else { voiceSignalRStore.leaveVoiceChannel(); } } } };

    const handleLeaveVoiceChannel = () => {
        voiceSignalRStore.leaveVoiceChannel();
        const firstTextChannel = channelStore.channels.find(c => c.channelType === 'text');
        if (firstTextChannel && serverId) { navigate(`/server/${serverId}/${firstTextChannel.channelId}`); } else if (serverId) { navigate(`/server/${serverId}`); }
    };

    const getAvatarLetter = (name?: string | null) => ((name || "U")[0] || 'U').toUpperCase();
    const stringToColor = (str?: string | null): string => { if (!str) return '#7289da'; let hash = 0; for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); hash = hash & hash; } let color = '#'; for (let i = 0; i < 3; i++) { const value = (hash >> (i * 8)) & 0xFF; color += ('00' + value.toString(16)).slice(-2); } return color; };

    type AvatarUserType = { id?: string | null, username?: string | null, image?: string | null, isMuted?: boolean };

    const getAvatarProps = (user: AvatarUserType | undefined | null) => {
        const name = user?.username || "User";

        const baseAvatarStyles = {
            width: 30,
            height: 30,
            fontSize: '0.65rem',
            mr: 0.8
        };

        if (!user || !user.id) {
            return {
                sx: { ...baseAvatarStyles, bgcolor: '#7289da' },
                children: getAvatarLetter(name),
            };
        }

        if (user.image && typeof user.image === 'string') {
            const imageUrl = (user.image.startsWith('http') || user.image.startsWith('blob:'))
                ? user.image
                : `http://localhost:5000${user.image.startsWith('/') ? '' : '/'}${user.image}`;

            return {
                src: imageUrl,
                sx: baseAvatarStyles
            };
        }

        return {
            sx: { ...baseAvatarStyles, bgcolor: stringToColor(user.id) },
            children: getAvatarLetter(name),
        };
    };

    const actualCurrentVoiceChannelObject = channelStore.channels.find(c => c.channelId === voiceSignalRStore.currentVoiceChannelId);
    const toggleServerMembers = () => { setSideBarOpen(prev => !prev); };

    let userForOwnAvatarInList: AvatarUserType | undefined = undefined;
    if (voiceSignalRStore.localUserVoiceState) {
        userForOwnAvatarInList = {
            ...voiceSignalRStore.localUserVoiceState,
            image: voiceSignalRStore.localUserVoiceState.image || userStore.user?.image || undefined,
            id: voiceSignalRStore.localUserVoiceState.id,
            username: voiceSignalRStore.localUserVoiceState.username || "User",
        };
    }


    return (
        <Box display="flex" flexDirection="row" height="100%" width="100%" sx={{ backgroundColor: "#36393f", color: 'white', overflow: 'hidden' }}>
            <Box display="flex" flexDirection="column" sx={{ backgroundColor: "#2f3136", width: "240px", flexShrink: 0, height: '100%' }}>
                <Box sx={{ p: "12px 16px", height: '49px', borderBottom: '1px solid rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
                    <Typography variant="h6" sx={{ fontWeight: '600', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{serverStore.selectedServer?.name || "Server"}</Typography>
                </Box>
                <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', p: "10px 6px 10px 10px", boxSizing: 'border-box' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "0px 10px 4px 10px" }}><Typography variant="overline" sx={{ color: "#8e9297", fontWeight: '600', fontSize: '0.7rem' }}>TEXT CHANNELS</Typography><IconButton size="small" sx={{ color: '#8e9297', '&:hover': { color: '#dcddde', backgroundColor: 'rgba(255,255,255,0.05)' } }} onClick={() => handleOpenAddChannelDialog('text')} title="Create Text Channel"><AddIcon fontSize="inherit" /></IconButton></Box>
                    {channelStore.channels.filter(c => c.channelType === 'text').map((channelItem) => (<Box key={channelItem.channelId} onClick={() => handleChannelClick(channelItem)} display="flex" alignItems="center" width="100%" py="6px" px="10px" sx={{ color: channelIdParamFromUrl === channelItem.channelId ? 'white' : "#8e9297", backgroundColor: channelIdParamFromUrl === channelItem.channelId ? '#404650' : 'transparent', borderRadius: "4px", mb: "2px", cursor: "pointer", '&:hover': { backgroundColor: channelIdParamFromUrl === channelItem.channelId ? '#404650' : "#3c3f46", color: 'white' }, boxSizing: 'border-box', overflow: 'hidden' }}> <TagIcon sx={{ mr: 1.5, fontSize: '1.25rem', flexShrink: 0 }} /> <Typography variant="body1" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{channelItem.name}</Typography> </Box>))}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: "8px 10px 4px 10px", mt: 1 }}><Typography variant="overline" sx={{ color: "#8e9297", fontWeight: '600', fontSize: '0.7rem' }}>VOICE CHANNELS</Typography><IconButton size="small" sx={{ color: '#8e9297', '&:hover': { color: '#dcddde', backgroundColor: 'rgba(255,255,255,0.05)' } }} onClick={() => handleOpenAddChannelDialog('voice')} title="Create Voice Channel"><AddIcon fontSize="inherit" /></IconButton></Box>
                    {channelStore.channels.filter(c => c.channelType === 'voice').map((channelItem) => (
                        <Box key={channelItem.channelId} onClick={() => handleChannelClick(channelItem)} display="flex" flexDirection="column" width="100%" py="6px" px="10px" sx={{ color: voiceSignalRStore.currentVoiceChannelId === channelItem.channelId ? 'white' : "#8e9297", backgroundColor: voiceSignalRStore.currentVoiceChannelId === channelItem.channelId ? '#3ba55d' : 'transparent', borderRadius: "4px", mb: "2px", cursor: "pointer", '&:hover': { backgroundColor: voiceSignalRStore.currentVoiceChannelId === channelItem.channelId ? '#3ba55d' : "#3c3f46", color: 'white' }, boxSizing: 'border-box', overflow: 'hidden' }}>
                            <Box display="flex" alignItems="center" width="100%" sx={{ overflow: 'hidden' }}><VolumeUpIcon sx={{ mr: 1.5, fontSize: '1.25rem', flexShrink: 0 }} /><Typography variant="body1" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{channelItem.name}</Typography></Box>
                            {voiceSignalRStore.currentVoiceChannelId === channelItem.channelId && (
                                <Box component="ul" sx={{ listStyle: 'none', pl: '10px', pt: '4px', m: 0 }}>
                                    {userForOwnAvatarInList && userForOwnAvatarInList.id === voiceSignalRStore.localUserVoiceState?.id && (
                                        <Box component="li" sx={{ display: 'flex', alignItems: 'center', py: '2px' }}>
                                            <Avatar sx={{ width: 30, height: 30, fontSize: '0.65rem', mr: 0.8 }} {...getAvatarProps(userForOwnAvatarInList)} />
                                            <Typography variant="caption" sx={{ color: '#dcddde' }}>
                                                {userForOwnAvatarInList.username} (You)
                                                {userForOwnAvatarInList.isMuted && <MicOffIcon sx={{ fontSize: '0.8rem', verticalAlign: 'middle', ml: 0.5, color: '#f04747' }} />}
                                            </Typography>
                                        </Box>
                                    )}
                                    {Array.from(voiceSignalRStore.usersInCurrentChannel.values())
                                        .filter(u => u.id !== voiceSignalRStore.localUserVoiceState?.id)
                                        .map((userInChannel: VoiceUserDto) => (
                                            <Box component="li" key={userInChannel.id} sx={{ display: 'flex', alignItems: 'center', py: '2px' }}>
                                                <Avatar sx={{ width: 30, height: 30, fontSize: '0.65rem', mr: 0.8 }} {...getAvatarProps(userInChannel)} />
                                                <Typography variant="caption" sx={{ color: '#b9bbbe' }}>
                                                    {userInChannel.username}
                                                    {userInChannel.isMuted && <MicOffIcon sx={{ fontSize: '0.8rem', verticalAlign: 'middle', ml: 0.5, color: '#f04747' }} />}
                                                </Typography>
                                            </Box>
                                        ))}
                                </Box>
                            )}
                        </Box>
                    ))}
                </Box>
                {voiceSignalRStore.currentVoiceChannelId && userStore.user && actualCurrentVoiceChannelObject && (
                    <Box sx={{ p: "8px", backgroundColor: '#292b2f', borderTop: '1px solid rgba(0,0,0,0.3)' }}>
                        <Box display="flex" alignItems="center" mb={1}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', mr: 1 }} {...getAvatarProps(userStore.user)} />
                            <Box sx={{ overflow: 'hidden', flexGrow: 1 }}><Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', lineHeight: 1.2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{userStore.user.username}</Typography><Typography variant="caption" sx={{ color: '#43b581', fontWeight: 'bold', display: 'block', lineHeight: 1.2 }}>Voice Connected</Typography><Typography variant="caption" sx={{ color: '#b9bbbe', display: 'block', lineHeight: 1.2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{actualCurrentVoiceChannelObject.name}</Typography></Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            <IconButton onClick={() => voiceSignalRStore.toggleLocalMute()} size="medium" sx={{ color: voiceSignalRStore.localUserVoiceState?.isMuted ? '#f04747' : '#b9bbbe', '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' } }} title={voiceSignalRStore.localUserVoiceState?.isMuted ? "Unmute" : "Mute"} > {voiceSignalRStore.localUserVoiceState?.isMuted ? <MicOffIcon /> : <MicIcon />} </IconButton>
                            <IconButton onClick={() => voiceSignalRStore.toggleGlobalSpeakerMute()} size="medium" sx={{ color: voiceSignalRStore.isSpeakerGloballyMuted ? '#f04747' : '#b9bbbe', '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' } }} title={voiceSignalRStore.isSpeakerGloballyMuted ? "Unmute Speakers" : "Mute Speakers"} > {voiceSignalRStore.isSpeakerGloballyMuted ? <VolumeOffIcon /> : <VolumeUpIcon />} </IconButton>
                            <IconButton onClick={handleLeaveVoiceChannel} size="medium" sx={{ backgroundColor: 'rgba(240, 71, 71, 0.2)', color: '#f04747', '&:hover': { backgroundColor: 'rgba(240, 71, 71, 0.3)' } }} title="Disconnect" > <CallEndIcon /> </IconButton>
                        </Box>
                    </Box>
                )}
            </Box>
            <Box display="flex" flexDirection="column" sx={{ flexGrow: 1, backgroundColor: "#36393f", height: "100%", overflow: 'hidden' }}>
                {channelIdParamFromUrl ? (<Outlet context={{ isServerMembersOpen: sideBarOpen, toggleServerMembers } satisfies ChannelDashboardOutletContextType} />) : (<Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Typography variant="h6" color="text.secondary">{channelStore.loading ? "Loading channels..." : channelStore.channels.length > 0 ? "Select a text channel." : "No channels available."}</Typography></Box>)}
            </Box>
            <Box display="flex" flexDirection="column" sx={{ width: sideBarOpen ? "240px" : "60px", backgroundColor: "#2f3136", overflow: "hidden", flexShrink: 0, transition: 'width 0.2s ease-in-out', borderLeft: sideBarOpen ? '1px solid rgba(0,0,0,0.2)' : 'none', height: '100%' }}>
                <ServerMembers isOpen={sideBarOpen} setIsOpen={setSideBarOpen} />
            </Box>
            {serverId && (<AddChannelDialog serverId={serverId} open={addChannelDialogOpen} onClose={handleCloseAddChannelDialog} defaultChannelType={defaultChannelTypeForDialog} />)}
        </Box>
    );
});