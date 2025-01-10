import { observer } from "mobx-react-lite";
import { useStore } from "../../../app/stores/store";
import { Box } from "@mui/material";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { runInAction } from "mobx";
import agent from "../../../app/API/agent";
import PrivateChatMessage from "./PrivateChatMessage";
import PrivateMessageTextField from "./PrivateMessageTextField";
import PrivateMessage from "../../../app/Models/PrivateMessage";

export default observer(function FriendChatProfile() {
    const { userStore, signalRStore } = useStore();
    const { friendId } = useParams();
    const key = [userStore.user!.id, friendId].sort().join('-');
   

    useEffect(() => {
        const loadMessages = async () => {
            const newMessages = await agent.Messages.GetPrivateMessagesFromNDays(userStore.user!.id, friendId!, 1);
            if (newMessages.length === 0) return;
            runInAction(() => {
                const existingMessages = signalRStore.privateMessages.get(key) || [];
                signalRStore.privateMessages.set(key, [...newMessages]);
            });
        };
        loadMessages();
    }, [friendId, signalRStore.privateMessages.get(key)]);



    return (
        <Box display="flex" flexDirection="column" height="90vh" width="100%" sx={{ overflow: "hidden" }}>
            <Box
                display="flex"
                flexDirection="column-reverse"
                overflow="auto"
                sx={{
                    flexGrow: 1,
                    backgroundColor: "blue",
                    borderRadius: "20px",
                    m: "10px",
                }}
            >
                {signalRStore.privateMessages.get(key)! ? (
                    signalRStore.privateMessages.get(key)!.map((message) => (
                        <Box
                            key={message.messageId}
                            sx={{
                                alignSelf: message.senderId === userStore.user!.id ? "flex-end" : "flex-start",
                                width: "70%",
                                p: "10px",
                            }}
                        >
                            <PrivateChatMessage message={message} />
                        </Box>
                    ))
                ) : (
                    <Box sx={{ textAlign: "center", color: "gray" }}>No messages</Box>
                )}
            </Box>

            <Box sx={{ m: "10px", borderTop: "1px solid gray" }}>
                <PrivateMessageTextField />
            </Box>
        </Box>
    );
});
