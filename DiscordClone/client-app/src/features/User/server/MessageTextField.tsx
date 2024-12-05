import { Box, Button, TextField } from "@mui/material";
import { ChangeEvent, useState } from "react";
import { useStore } from "../../../app/stores/store";
import ChatMessage from "../../../app/Models/ChatMessage";
import { v4 as uuidv4 } from 'uuid';

export default function MessageTextField() {
    const { signalRStore, userStore } = useStore();
    const [content, setContent] = useState("");

    const handleMessageChange = (e: ChangeEvent<HTMLInputElement>) => {
        setContent(e.target.value);
    };

    const handleSend = () => {
        if (!content.trim()) return; 

        const message: ChatMessage = {
            messageId: uuidv4(),
            content: content.trim(),
            createdAt: new Date(),
            isEdited: false,
            userName: userStore.user?.username || "Anonymous",
            channelId: "cfe759f0-fcc4-41b2-a0d7-941f07b3a88c",
            serverId: "f8ed3d61-8b96-473c-b4d0-a6595992d0a1",
        };

        signalRStore.sendMessage({
            userName: "user" as string,
            message: message.content || "text" as string,
            serverName: "Server1" as string,
            channelName: "General" as string
        });
        setContent(""); 
    };

    return (
        <Box display="flex" gap={2} alignItems="center" width="100%">
            <TextField
                fullWidth
                value={content}
                onChange={handleMessageChange}
                placeholder="Type your message..."
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault(); 
                        handleSend();
                    }
                }}
            />
            <Button variant="contained" onClick={handleSend}>
                Send
            </Button>
        </Box>
    );
}
