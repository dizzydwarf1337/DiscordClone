import { observer } from "mobx-react-lite";
import { useStore } from "../../../app/stores/store";
import { Box, TextField } from "@mui/material";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { runInAction } from "mobx";
import agent from "../../../app/API/agent";
import PrivateChatMessage from "./PrivateChatMessage";
import PrivateMessageTextField from "./PrivateMessageTextField";

export default observer(function FriendChatProfile() {
    const { userStore, signalRStore } = useStore();
    const { friendId } = useParams();
    const key = [userStore.user!.id, friendId].sort().join('-');
    const [page, setPage] = useState<number>(1);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filteredMessages, setFilteredMessages] = useState<PrivateMessage[]>([]);

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const newMessages = await agent.Messages.GetPrivateMessagesFromNDays(
                    userStore.user!.id,
                    friendId!,
                    page
                );
                runInAction(() => {
                    signalRStore.privateMessages.set(key, newMessages);
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
        const allMessages = signalRStore.privateMessages.get(key) || [];
        const filtered = allMessages.filter((message) =>
            message.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredMessages(filtered);
    }, [searchQuery, signalRStore.privateMessages.get(key)?.length]);

    return (
        <Box display="flex" flexDirection="column" height="90vh" width="100%" sx={{ overflow: "hidden" }}>
            <Box sx={{ m: "10px" }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    label="Search Messages"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </Box>

            <Box
                display="flex"
                flexDirection="column-reverse"
                overflow="auto"
                sx={{
                    flexGrow: 1,
                    borderRadius: "20px",
                    m: "10px",
                }}
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
                <PrivateMessageTextField />
            </Box>
        </Box>
    );
});
