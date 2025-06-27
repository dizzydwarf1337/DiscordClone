import { observer } from "mobx-react-lite";
import { useStore } from "../../../app/stores/store";
import { Box, TextField, Button, Typography, Avatar, IconButton, Tooltip } from "@mui/material";
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { runInAction } from "mobx";
import agent from "../../../app/API/agent";
import PrivateChatMessage from "./PrivateChatMessage";
import PrivateMessageTextField from "./PrivateMessageTextField";
import PrivateMessage from "../../../app/Models/PrivateMessage";
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import SearchIcon from '@mui/icons-material/Search';

export default observer(function FriendChatProfile() {
    const { userStore, chatSignalRStore, voiceSignalRStore, friendStore } = useStore();
    const { friendId } = useParams<{ friendId: string }>();
    const key = userStore.user!.id && friendId ? [userStore.user!.id, friendId].sort().join('-') : null;
    const [page, setPage] = useState<number>(1);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filteredMessages, setFilteredMessages] = useState<PrivateMessage[]>([]);
    const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    const currentFriend = friendStore.friends.find(f => f.id === friendId);

    const handleCall = async () => { if (friendId) { await voiceSignalRStore.makeCall(friendId); } };
    const handleEndCall = async () => { if (friendId) { await voiceSignalRStore.endCall(); } };

    useEffect(() => {
        const loadMessages = async () => {
            if (!key || !userStore.user?.id || !friendId) return; 
            try {
                const newMessagesResponse = await agent.Messages.GetPrivateMessagesFromNDays(
                    userStore.user!.id,
                    friendId!,
                    page
                );
              
                const newMessages = newMessagesResponse || [];

                runInAction(() => {
                    const currentMessages = chatSignalRStore.privateMessages.get(key) || [];
                    const uniqueMessages = newMessages.filter(
                        (newMessage: PrivateMessage) => !currentMessages.some((msg) => msg.messageId === newMessage.messageId)
                    );
                    const sortedMessages = [...currentMessages, ...uniqueMessages].sort(
                        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
                    );
                    chatSignalRStore.privateMessages.set(key, sortedMessages);
                });
            } catch (error) {
                console.error("Failed to load messages:", error);
            }
        };
        if (friendId && userStore.user?.id && key) {
            loadMessages();
        }
    }, [friendId, page, userStore.user, key, chatSignalRStore]);

    useEffect(() => {
        const filterMessages = async () => {
            if (!key) { setFilteredMessages([]); return; }
            const allMessages = chatSignalRStore.privateMessages.get(key) || [];
            const filtered = searchQuery
                ? allMessages.filter((message) =>
                    message.content.toLowerCase().includes(searchQuery.toLowerCase())
                )
                : allMessages;
            setFilteredMessages(filtered);
            if (friendId && userStore.user?.id) {
                await chatSignalRStore.markMessagesAsRead('private', friendId);
            }
        };
        if (key) {
            filterMessages();
        }
    }, [searchQuery, chatSignalRStore.privateMessages.get(key)?.length, key, friendId, userStore.user, chatSignalRStore]);

    useEffect(() => {
        if (containerRef && shouldAutoScroll) {
            containerRef.scrollTop = containerRef.scrollHeight;
        }
    }, [filteredMessages, containerRef, shouldAutoScroll]);

    const handleScroll = () => {
        if (containerRef) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef;
            const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 50;
            setShouldAutoScroll(isNearBottom);
        }
    };
    const getAvatarLetter = (name?: string) => (name?.[0] || '?').toUpperCase();


    return (
        <Box
            display="flex"
            flexDirection="column"
            height="100%"
            width="100%"
            sx={{
                backgroundColor: "#36393f",
                color: 'white',
                overflow: "hidden"
            }}
        >
            <Box
                sx={{
                    p: "0px 16px",
                    height: '49px',
                    borderBottom: '1px solid #202225',
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: 'center',
                    flexShrink: 0,
                    boxSizing: 'border-box'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                    {currentFriend ? (
                        <>
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem' }} src={currentFriend.image || undefined}>
                                {!currentFriend.image && getAvatarLetter(currentFriend.username)}
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '1rem', color: '#f2f3f5' }}>
                                {currentFriend.username || "Friend"}
                            </Typography>
                        </>
                    ) : (
                        <Typography variant="h6" sx={{ fontWeight: '600', color: '#f2f3f5', fontSize: '1rem' }}>Direct Message</Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                        variant="standard"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ color: '#72767d', mr: 0.5, fontSize: '1.125rem' }} />,
                            disableUnderline: true,
                            sx: {
                                color: '#dcddde', fontSize: '0.875rem',
                                backgroundColor: '#202225', borderRadius: '4px',
                                p: '4px 8px', height: '32px'
                            }
                        }}
                        sx={{ width: '180px' }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleCall}
                        disabled={voiceSignalRStore.isInCall}
                        sx={{
                            ml: 1,
                            minWidth: 'auto', p: '5px 10px', height: '32px',
                            bgcolor: voiceSignalRStore.isInCall ? '#4f545c' : '#3ba55c',
                            color: 'white', textTransform: 'none', fontSize: '0.875rem',
                            '&:hover': { bgcolor: voiceSignalRStore.isInCall ? '#4f545c' : '#2d7d46' },
                            '&.Mui-disabled': { bgcolor: '#40444b', color: '#72767d' }
                        }}
                        startIcon={<CallIcon sx={{ fontSize: '1rem', mr: 0.2 }} />}
                    >
                        Call
                    </Button>
                    {voiceSignalRStore.isInCall && (
                        <Button
                            variant="contained"
                            onClick={handleEndCall}
                            sx={{
                                ml: 1,
                                minWidth: 'auto', p: '5px 10px', height: '32px',
                                bgcolor: '#d83c3e', color: 'white', textTransform: 'none', fontSize: '0.875rem',
                                '&:hover': { bgcolor: '#b02628' }
                            }}
                            startIcon={<CallEndIcon sx={{ fontSize: '1rem', mr: 0.2 }} />}
                        >
                            Hang up
                        </Button>
                    )}
                </Box>
            </Box>

            <Box
                ref={setContainerRef}
                display="flex"
                flexDirection="column"
                overflow="auto"
                sx={{
                    flexGrow: 1,
                    borderRadius: "0px",
                    m: "0px",
                    p: "0px 0px 10px 0px",
                    backgroundColor: "transparent"
                }}
                onScroll={handleScroll}
            >
                {filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                        <Box
                            key={message.messageId}
                            sx={{
                                display: "flex",
                                justifyContent: message.senderId === userStore.user?.id ? "flex-end" : "flex-start",
                                p: "0px 10px",
                            }}
                        >
                            <Box
                                sx={{
                                    textAlign: message.senderId === userStore.user?.id ? "right" : "left",
                                    borderRadius: "10px",
                                    padding: "10px",
                                    wordWrap: "break-word",
                                    backgroundColor: message.senderId === userStore.user?.id ? '#5865f2' : '#3a3c41',
                                    color: message.senderId === userStore.user?.id ? 'white' : '#dcddde',
                                    display: 'inline-block',
                                    maxWidth: '75%',
                                    mt: '1px', mb: '1px'
                                }}
                            >
                                <PrivateChatMessage message={message} userId={message.senderId} />
                            </Box>
                        </Box>
                    ))
                ) : (
                    <Box sx={{ textAlign: "center", color: "gray", my: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                        <Typography>No messages</Typography>
                    </Box>
                )}
            </Box>

            <Box sx={{
                p: "0px 16px 20px 16px",
                backgroundColor: "#36393f"
            }}>
                <PrivateMessageTextField
                    onSend={() => {
                        setShouldAutoScroll(true);
                    }}
                    friendName={currentFriend?.username || "this user"}
                />
            </Box>
        </Box>
    );
});