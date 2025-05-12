import { observer } from "mobx-react-lite";
import { useStore } from "../../../app/stores/store";
import { Box, TextField } from "@mui/material";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { runInAction } from "mobx";
import agent from "../../../app/API/agent";
import PrivateChatMessage from "./PrivateChatMessage";
import PrivateMessageTextField from "./PrivateMessageTextField";
import PrivateMessage from "../../../app/Models/PrivateMessage";

import { Button } from "@mui/material"; // Импортируем кнопку

export default observer(function FriendChatProfile() {
    const { userStore, signalRStore } = useStore();
    const { friendId } = useParams();
    const key = [userStore.user!.id, friendId].sort().join('-');
    const [page, setPage] = useState<number>(1);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filteredMessages, setFilteredMessages] = useState<PrivateMessage[]>([]);
    const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    const handleCall = async () => {
        if (friendId) {
            await signalRStore.makeCall(friendId);
        }
    };

    const handleEndCall = async () => {
        if (friendId) {
            await signalRStore.endCall(friendId);
        }
    };

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const newMessages = await agent.Messages.GetPrivateMessagesFromNDays(
                    userStore.user!.id,
                    friendId!,
                    page
                );
                runInAction(() => {
                    const currentMessages = signalRStore.privateMessages.get(key) || [];
                    const uniqueMessages = newMessages.filter(
                        (newMessage) => !currentMessages.some((msg) => msg.messageId === newMessage.messageId)
                    );
                    const sortedMessages = [...currentMessages, ...uniqueMessages].sort(
                        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
                    );
                    signalRStore.privateMessages.set(key, sortedMessages);
                });
            } catch (error) {
                console.error("Failed to load messages:", error);
            }
        };

        if (friendId) {
            loadMessages();
        }
    }, [friendId, page]);

    useEffect(() => {
        const filterMessages = async () => {
            const allMessages = signalRStore.privateMessages.get(key) || [];
            const filtered = allMessages.filter((message) =>
                message.content.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredMessages(filtered);
            if (friendId) {
                await signalRStore.markMessagesAsRead('private', friendId);
            }
        };

        filterMessages();
    }, [searchQuery, signalRStore.privateMessages.get(key)?.length]);

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

    return (
        <Box display="flex" flexDirection="column" height="90vh" width="100%" sx={{ overflow: "hidden" }}>
            <Box sx={{ m: "10px", display: "flex", justifyContent: "space-between" }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    label="Search Messages"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCall}
                    disabled={signalRStore.isInCall}
                    sx={{ ml: 2 }}
                >
                    Call
                </Button>
                {signalRStore.isInCall && (
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleEndCall}
                        sx={{ ml: 2 }}
                    >
                        Hang up
                    </Button>
                )}
            </Box>

            <Box
                ref={setContainerRef}
                display="flex"
                flexDirection="column"
                overflow="auto"
                sx={{
                    flexGrow: 1,
                    borderRadius: "20px",
                    m: "10px",
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
                                p: "10px",
                            }}
                        >
                            <Box
                                sx={{
                                    textAlign: message.senderId === userStore.user?.id ? "right" : "left",
                                    borderRadius: "10px",
                                    padding: "10px",
                                    wordWrap: "break-word",
                                }}
                            >
                                <PrivateChatMessage message={message} userId={message.senderId} />
                            </Box>
                        </Box>
                    ))
                ) : (
                    <Box sx={{ textAlign: "center", color: "gray" }}>No messages</Box>
                )}
            </Box>

            <Box sx={{ m: "10px" }}>
                <PrivateMessageTextField
                    onSend={() => {
                        // When sending a new message, enable auto-scroll
                        setShouldAutoScroll(true);
                    }}
                />
            </Box>
        </Box>
    );
});