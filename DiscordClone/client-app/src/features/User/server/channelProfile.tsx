import { observer } from "mobx-react-lite";
import { useStore } from "../../../app/stores/store";
import { Box } from "@mui/material";
import Message from "./message";
import MessageTextField from "./MessageTextField";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { runInAction } from "mobx";

export default observer(function ChannelProfile() {
    const { channelStore, userStore, signalRStore } = useStore();
    const { serverId, channelIdParam } = useParams();
    const [page, setPage] = useState<number>(1);

    useEffect(() => {
        const loadMessages = async () => {
            const messages = await channelStore.getMessagesFromLastDaysApi(channelIdParam!, page);
            console.log(messages);
            runInAction(() => {
                signalRStore.messages.set(channelIdParam!, messages);
            });
        };
        loadMessages();
    }, [channelIdParam, page, channelStore, signalRStore.messages]);

    return (
        <Box display="flex" flexDirection="column" width="100%" gap="10px" sx={{ m: "20px 10px 20px 10px" }}>
            <Box display="flex" flexDirection="column" overflow="auto" gap="10px" sx={{ backgroundColor: "blue", borderRadius: "20px" }}>
                {signalRStore.messages.get(channelIdParam!) && signalRStore.messages.get(channelIdParam!)!.length > 0 ? (
                    signalRStore.messages.get(channelIdParam!)!.map((message) => (
                        <Box key={message.messageId}
                            sx={{
                                alignSelf: message.senderId === userStore.user!.id ? "flex-end" : "flex-start",
                                width: "70%",
                                p: "10px",
                            }}
                        >
                            <Message message={message} userId={message.senderId} />
                        </Box>
                    ))
                ) : (
                    <Box sx={{ textAlign: "center", color: "gray" }}>No messages</Box>
                )}
            </Box>
            <Box sx={{ m: "0px 5px 0px 5px" }}>
                <MessageTextField />
            </Box>
        </Box>
    );
});
