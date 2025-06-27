import { observer } from "mobx-react-lite";
import { useStore } from "../../../app/stores/store";
import { Box, Typography, CircularProgress, IconButton, Tooltip } from "@mui/material";
import Message from "./message";
import MessageTextField from "./MessageTextField";
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { runInAction } from "mobx";
import TagIcon from '@mui/icons-material/Tag';
import GroupsIcon from '@mui/icons-material/Groups';

interface ChannelProfileProps {
    isServerMembersOpen?: boolean;
    toggleServerMembers?: () => void;
}

export default observer(function ChannelProfile({ isServerMembersOpen, toggleServerMembers }: ChannelProfileProps) {
    const { channelStore, userStore, chatSignalRStore } = useStore();
    const { channelIdParam } = useParams<{ channelIdParam: string }>();
    const [page, setPage] = useState<number>(1);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const currentChannel = channelStore.channels.find(c => c.channelId === channelIdParam);

    useEffect(() => {
        const loadTextMessages = async () => {
            if (!channelIdParam || !currentChannel || currentChannel.channelType !== 'text') {
                if (channelIdParam) {
                    runInAction(() => {
                        chatSignalRStore.messages.delete(channelIdParam);
                    });
                }
                return;
            }
            const messages = await channelStore.getMessagesFromLastDaysApi(channelIdParam, page);
            runInAction(() => {
                const sortedMessages = messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                chatSignalRStore.messages.set(channelIdParam, sortedMessages);
            });
        };
        loadTextMessages();
    }, [channelIdParam, page, channelStore, chatSignalRStore, currentChannel, chatSignalRStore.refreshChannelMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, [chatSignalRStore.messages.get(channelIdParam!)]);


    if (!channelIdParam && !channelStore.loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8e9297', textAlign: 'center' }}>
                <TagIcon sx={{ fontSize: '4rem', mb: 2 }} />
                <Typography variant="h6">No text channel selected.</Typography>
                <Typography variant="body2">Pick a channel to get the conversation started.</Typography>
            </Box>
        );
    }

    if (channelStore.loading && (!chatSignalRStore.messages.get(channelIdParam!) || chatSignalRStore.messages.get(channelIdParam!)?.length === 0)) {
        return (
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8e9297' }}>
                <CircularProgress color="inherit" size={24} />
                <Typography variant="body1" sx={{ ml: 2 }}>Loading messages...</Typography>
            </Box>
        );
    }

    if (!currentChannel && !channelStore.loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8e9297' }}>
                <Typography variant="h6">Channel not found.</Typography>
            </Box>
        );
    }

    if (currentChannel && currentChannel.channelType !== 'text') {
        return (
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8e9297' }}>
                <Typography variant="h6">This is not a text channel.</Typography>
                <Typography variant="body2">Select a text channel to view messages.</Typography>
            </Box>
        );
    }

    const messagesForCurrentChannel = chatSignalRStore.messages.get(channelIdParam);

    return (
        <Box display="flex" flexDirection="column" width="100%" height="100%" sx={{ backgroundColor: "#36393f" }}>
            <Box
                sx={{
                    p: "0px 16px",
                    height: '49px',
                    borderBottom: '1px solid rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    color: 'white'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                    <TagIcon sx={{ mr: 1, color: '#72767d', fontSize: '1.5rem' }} />
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: '600',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {currentChannel?.name || "Channel"}
                    </Typography>
                </Box>
                {toggleServerMembers && (
                    <Tooltip title={isServerMembersOpen ? "Hide Member List" : "Show Member List"} placement="bottom">
                        <IconButton
                            onClick={toggleServerMembers}
                            size="medium"
                            sx={{
                                color: isServerMembersOpen ? 'white' : '#b9bbbe',
                                '&:hover': { color: 'white', backgroundColor: 'rgba(255,255,255,0.08)' }
                            }}
                        >
                            <GroupsIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
            <Box
                display="flex"
                flexDirection="column"
                flexGrow={1}
                sx={{ overflow: 'hidden', position: 'relative' }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        overflowY: 'auto',
                        p: "16px 16px 0px 16px",
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {messagesForCurrentChannel && messagesForCurrentChannel.length > 0 ? (
                        messagesForCurrentChannel.map((message) => (
                            <Message key={message.messageId} message={message} userId={message.senderId} />
                        ))
                    ) : (
                        <Box sx={{ textAlign: "center", color: "#8e9297", my: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Welcome to #{currentChannel?.name || 'the channel'}!</Typography>
                            <Typography variant="body2">This is the beginning of this channel's history.</Typography>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Box>
            </Box>
            <Box sx={{ p: "0px 16px 20px 16px", flexShrink: 0 }}>
                <MessageTextField
                    channelName={currentChannel?.name || "this channel"}
                    channelId={channelIdParam}
                />
            </Box>
        </Box>
    );
});