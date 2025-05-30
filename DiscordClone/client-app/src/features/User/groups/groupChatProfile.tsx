import { observer } from "mobx-react-lite";
import { useStore } from "../../../app/stores/store";
import { Box, TextField, Typography, Avatar, IconButton, Tooltip } from "@mui/material";
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { runInAction } from "mobx";
import GroupChatMessage from "./groupChatMessage";
import GroupChatMessageTextField from "./groupChatMessageTextField";
import agent from "../../../app/API/agent";
import GroupMembers from "./groupMembers";
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import { GroupMessage } from "../../../app/Models/GroupMessage";

export default observer(function GroupChatProfile() {
    const { userStore, chatSignalRStore, friendStore } = useStore();
    const { groupId } = useParams<{ groupId: string }>();
    const [page, setPage] = useState<number>(1);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [sideBarOpen, setSideBarOpen] = useState<boolean>(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);

    const userId = userStore.user?.id;
    const key = groupId;

    const currentGroup = friendStore.friendGroups.find(g => g.id === groupId);

    useEffect(() => {
        const loadInitialMessages = async () => {
            if (!userId || !groupId || !key) {
                runInAction(() => { if (key) chatSignalRStore.groupMessages.set(key, []); });
                return;
            }
            setIsLoadingMessages(true);
            try {
                const result = await agent.Messages.GetGroupMessagesFromLastDays(userId, groupId, 1);
                const newApiMessages: GroupMessage[] = result?.data || result?.value || result || [];
                runInAction(() => {
                    const sortedMessages = [...newApiMessages].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
                    chatSignalRStore.groupMessages.set(key, sortedMessages);
                });
            } catch (error) {
                runInAction(() => { if (key) chatSignalRStore.groupMessages.set(key, []); });
            } finally {
                setIsLoadingMessages(false);
            }
        };
        setPage(1);
        loadInitialMessages();
    }, [groupId, userId]);

    useEffect(() => {
        const loadOlderMessages = async () => {
            if (!userId || !groupId || !key || page <= 1) return;
            setIsLoadingMessages(true);
            try {
                const result = await agent.Messages.GetGroupMessagesFromLastDays(userId, groupId, page);
                const newApiMessages: GroupMessage[] = result?.data || result?.value || result || [];
                if (newApiMessages.length > 0) {
                    runInAction(() => {
                        const currentMessagesInStore = chatSignalRStore.groupMessages.get(key) || [];
                        const uniqueNewMessages = newApiMessages.filter(
                            (newMessage) => !currentMessagesInStore.some((msg) => msg.messageId === newMessage.messageId)
                        );
                        const updatedMessages = [...uniqueNewMessages, ...currentMessagesInStore].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
                        chatSignalRStore.groupMessages.set(key, updatedMessages);
                    });
                }
            } catch (error) { /* Handle error */ }
            finally { setIsLoadingMessages(false); }
        };
        if (page > 1) { loadOlderMessages(); }
    }, [page, groupId, userId, key, chatSignalRStore]);

    const allMessagesInStore = key ? chatSignalRStore.groupMessages.get(key) || [] : [];
    const filteredMessages = searchQuery
        ? allMessagesInStore.filter((message) =>
            message.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : allMessagesInStore;

    useEffect(() => {
        const handleSignalRActions = async () => {
            if (chatSignalRStore.isConnected && groupId && userId) {
                await chatSignalRStore.joinGroup(groupId);
                if (allMessagesInStore.length > 0) {
                    await chatSignalRStore.markMessagesAsRead('group', groupId);
                }
            } else if (groupId && userId && !chatSignalRStore.isConnected && !chatSignalRStore.isConnecting) {
                chatSignalRStore.startConnection();
            }
        };
        handleSignalRActions();
    }, [chatSignalRStore.isConnected, chatSignalRStore.isConnecting, groupId, userId, allMessagesInStore.length, chatSignalRStore]);

    useEffect(() => {
        if (messagesEndRef.current && page === 1 && !isLoadingMessages) {
            messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        }
    }, [filteredMessages.length, page, isLoadingMessages]);

    const getAvatarLetter = (name?: string) => (name?.[0] || '?').toUpperCase();

    return (
        <Box display="flex" flexDirection="row" height="100%" width="100%">
            {/* Main Chat Area Box (Header, Messages, Input) */}
            <Box
                display="flex" flexDirection="column" height="100%"
                width="100%"
                sx={{ backgroundColor: "#36393f", color: 'white', overflow: "hidden", flexGrow: 1 }}
            >
                {/* Box for Header Bar */}
                <Box
                    sx={{
                        p: "0px 16px", height: '49px', borderBottom: '1px solid #202225',
                        display: "flex", justifyContent: "space-between", alignItems: 'center',
                        flexShrink: 0, boxSizing: 'border-box'
                    }}
                >
                    {/* Box for Group Info (Avatar and Name) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: '#5865f2' }}>
                            {(currentGroup?.name?.[0] || 'G').toUpperCase()}
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '1rem', color: '#f2f3f5' }}>
                            {currentGroup?.name || "Group Chat"}
                        </Typography>
                    </Box>
                    {/* Box for Header Actions (Search, Members Toggle) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField fullWidth variant="standard" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{ startAdornment: <SearchIcon sx={{ color: '#72767d', mr: 0.5, fontSize: '1.125rem' }} />, disableUnderline: true, sx: { color: '#dcddde', fontSize: '0.875rem', backgroundColor: '#202225', borderRadius: '4px', p: '4px 8px', height: '32px' } }}
                            sx={{ width: '180px' }}
                        />
                        {groupId && (
                            <Tooltip title={sideBarOpen ? "Hide Members" : "Show Members"}>
                                <IconButton onClick={() => setSideBarOpen(!sideBarOpen)} size="medium" sx={{ color: sideBarOpen ? 'white' : '#b9bbbe', '&:hover': { color: 'white', backgroundColor: 'rgba(255,255,255,0.08)' } }}>
                                    <GroupIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                {/* Box for Message List Scrollable Container */}
                <Box
                    ref={messagesEndRef}
                    display="flex"
                    flexDirection="column-reverse"
                    overflow="auto"
                    sx={{
                        flexGrow: 1,
                        paddingTop: '10px',
                        paddingBottom: '10px',
                        backgroundColor: "transparent"
                    }}
                >
                    {/* Box as an inner wrapper for messages, to work with column-reverse */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                        {filteredMessages.length > 0 ? (
                            [...filteredMessages].map((message) => (
                                // Box for a single message line (alignment and line padding)
                                <Box
                                    key={message.messageId}
                                    sx={{
                                        display: "flex",
                                        justifyContent: message.senderId === userId ? "flex-end" : "flex-start",
                                        p: "0px 10px",
                                    }}
                                >
                                    {/* Box for the message bubble itself */}
                                    <Box
                                        sx={{
                                            textAlign: message.senderId === userId ? "right" : "left",
                                            borderRadius: "10px",
                                            padding: "10px",
                                            wordWrap: "break-word",
                                            backgroundColor: message.senderId === userId ? '#5865f2' : '#3a3c41',
                                            color: message.senderId === userId ? 'white' : '#dcddde',
                                            display: 'inline-block',
                                            maxWidth: '75%',
                                            mt: '1px', mb: '1px'
                                        }}
                                    >
                                        <GroupChatMessage message={message} userId={userId || ""} />
                                    </Box>
                                </Box>
                            ))
                        ) : (
                            // Box for "No messages" placeholder
                            <Box sx={{ textAlign: "center", color: "gray", my: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, p: 2 }}>
                                <Typography>
                                    {isLoadingMessages ? "Loading messages..." : "No messages in this group yet. Start the conversation!"}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Box for Message Input Area */}
                <Box sx={{ p: "0px 16px 20px 16px", flexShrink: 0, backgroundColor: "#36393f" }}>
                    <GroupChatMessageTextField
                        groupId={groupId}
                        channelName={currentGroup?.name || "this group"}
                    />
                </Box>
            </Box>

            {/* Box for Group Members Sidebar (Right) */}
            {groupId && (
                <Box
                    display="flex" flexDirection="column"
                    sx={{
                        width: sideBarOpen ? "240px" : "0px", backgroundColor: "#2f3136",
                        overflow: "hidden", flexShrink: 0, transition: 'width 0.2s ease-in-out',
                        borderLeft: sideBarOpen ? '1px solid rgba(0,0,0,0.2)' : 'none', height: '100%'
                    }}
                >
                    {sideBarOpen &&
                        <GroupMembers
                            key={groupId + "-members"}
                            isOpen={sideBarOpen}
                            setIsOpen={setSideBarOpen}
                            groupId={groupId}
                        />
                    }
                </Box>
            )}
        </Box>
    );
});