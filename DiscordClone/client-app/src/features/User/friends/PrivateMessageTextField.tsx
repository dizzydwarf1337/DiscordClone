import { Box, Button, IconButton, TextField } from "@mui/material";
import { ChangeEvent, useEffect, useState } from "react";
import { useStore } from "../../../app/stores/store";
import { v4 as uuidv4 } from 'uuid';
import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import PrivateMessage from "../../../app/Models/PrivateMessage";
import SendIcon from '@mui/icons-material/Send';
export default observer(function PrivateMessageTextField() {
    const { signalRStore, userStore } = useStore();
    const [content, setContent] = useState("");
    const { friendId } = useParams();
    const handleMessageChange = (e: ChangeEvent<HTMLInputElement>) => {
        setContent(e.target.value);
    };
    useEffect(() => { },[signalRStore])

    const handleSend = async () => {
        if (!content.trim()) return;

        const message: PrivateMessage = {
            messageId: uuidv4(),
            senderId: userStore.user!.id,
            sentAt: new Date(),
            content: content.trim(),
            receiverId: friendId!,
        };
        try {
            await signalRStore.sendPrivateMessage(message);
            setContent("");

        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    return (
        <Box
            display="flex"
            gap={2}
            alignItems="center"
            width="100%"
        >
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
                sx={{
                    flexGrow: 1,
                }}
            />
            <IconButton onClick={handleSend}>
                <SendIcon/>
            </IconButton>
        </Box>
    );
});
