import { observer } from "mobx-react-lite";
import { useStore } from "../../../app/stores/store";
import { Box, TextField, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { runInAction } from "mobx";
import GroupChatMessage from "./groupChatMessage";
import GroupChatMessageTextField from "./groupChatMessageTextField";
import agent from "../../../app/API/agent";
import GroupMembers from "./groupMembers";
import GroupCallSection from "./groupCallSection";

export default observer(function GroupChatProfile() {
    const { userStore, signalRStore, callStore } = useStore();
    const { groupId } = useParams();
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [sideBarOpen, setSideBarOpen] = useState(false);

    const userId = userStore.user?.id;
    const key = groupId!;

    useEffect(() => {
        const loadMessages = async () => {
            if (!userId || !groupId) return;

            try {
                const newMessages = await agent.Messages.GetGroupMessagesFromLastDays(userId, groupId, page);
                await signalRStore.joinGroup(groupId);

                runInAction(async () => {
                    await signalRStore.groupMessages.set(key, newMessages);
                    await signalRStore.markMessagesAsRead("group", groupId);
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
        <>
            <Box display="flex" flexDirection="column" height="90vh" width="100%">
                {/* Call Section */}
                {callStore.currentCall && callStore.currentCall.groupId == groupId && (
                    <Box sx={{ flexShrink: 0, height: "310px", borderBottom: "1px solid #333" }}>
                        <GroupCallSection />
                    </Box>
                )}

                {/* Search */}
                <Box sx={{ m: 2 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        label="Search Messages"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </Box>

                {/* Messages */}
                <Box
                    sx={{
                        flexGrow: 1,
                        overflowY: "auto",
                        mx: 2,
                        mb: 1,
                        pr: 1,
                        borderRadius: "12px",
                    }}
                >
                    {filteredMessages.length > 0 ? (
                        filteredMessages.map((message) => (
                            <Box
                                key={message.messageId}
                                sx={{
                                    display: "flex",
                                    justifyContent: message.senderId === userId ? "flex-end" : "flex-start",
                                    p: 1,
                                }}
                            >
                                <Box
                                    sx={{
                                        textAlign: message.senderId === userId ? "right" : "left",
                                        borderRadius: 2,
                                        p: 1,
                                        wordBreak: "break-word",
                                    }}
                                >
                                    <GroupChatMessage message={message} userId={message.senderId} />
                                </Box>
                            </Box>
                        ))
                    ) : (
                        <Typography align="center" color="text.secondary" mt={2}>
                            No messages
                        </Typography>
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <Box sx={{ m: 2 }}>
                    <GroupChatMessageTextField />
                </Box>
            </Box>

            {/* Group Members Sidebar */}
            {groupId && (
                <GroupMembers
                    key={groupId}
                    isOpen={sideBarOpen}
                    setIsOpen={setSideBarOpen}
                    groupId={groupId}
                />
            )}
        </>
    );
});
