import { observer } from "mobx-react-lite";
import { useStore } from "../../../app/stores/store";
import { Box, TextField } from "@mui/material";
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { runInAction } from "mobx";
import GroupChatMessage from "./groupChatMessage";
import GroupChatMessageTextField from "./groupChatMessageTextField";
import agent from "../../../app/API/agent";

export default observer(function GroupChatProfile() {
    const { userStore, signalRStore } = useStore();
    const { groupId } = useParams();
    const [page, setPage] = useState<number>(1);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const userId = userStore.user?.id;
    const key = groupId!;

    // Pobieranie wiadomości
    useEffect(() => {
        const loadMessages = async () => {
            if (!userId || !groupId) return;

            try {
                const newMessages = await agent.Messages.GetGroupMessagesFromLastDays(
                    userId,
                    groupId,
                    page
                );

                await signalRStore.joinGroup(groupId); // Dołączenie do grupy SignalR

                runInAction(() => {
                    signalRStore.groupMessages.set(key, newMessages);
                });
            } catch (error) {
                console.error("Failed to load messages:", error);
            }
        };

        loadMessages();
    }, [groupId, page, userId]);

    const allMessages = signalRStore.groupMessages.get(key) || [];
    const filteredMessages = allMessages.filter((message) =>
        message.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [filteredMessages.length]);

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
                flexDirection="column"
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
                                justifyContent: message.senderId === userId ? "flex-end" : "flex-start",
                                p: "10px",
                            }}
                        >
                            <Box
                                sx={{
                                    textAlign: message.senderId === userId ? "right" : "left",
                                    borderRadius: "10px",
                                    padding: "10px",
                                    wordWrap: "break-word",
                                }}
                            >
                                <GroupChatMessage message={message} userId={message.senderId} />
                            </Box>
                        </Box>
                    ))
                ) : (
                    <Box sx={{ textAlign: "center", color: "gray" }}>No messages</Box>
                )}
                <div ref={messagesEndRef} />
            </Box>

            <Box sx={{ m: "10px" }}>
                <GroupChatMessageTextField />
            </Box>
        </Box>
    );
});
