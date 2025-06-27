import { useState, useRef } from "react";
import { Box, Button, TextField, IconButton } from "@mui/material";
import { useStore } from "../../../app/stores/store";
import { useParams } from "react-router-dom";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import { observer } from "mobx-react-lite";
import agent from "../../../app/API/agent";


export default observer(function MessageTextField() {
    const { userStore, chatSignalRStore } = useStore();
    const { serverId, channelIdParam } = useParams();
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState<FileList | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);


    const handleSubmit = async () => {
        if ((!message || message.trim() === '') && (!files || files.length === 0)) return;

        try {
            if (files && files.length > 0) {
                const newMessage = await chatSignalRStore.sendMessageWithAttachments(
                    message,
                    channelIdParam!,
                    userStore.user?.id!,
                    files
                );

                if (newMessage) {
                    const currentMessages = chatSignalRStore.messages.get(channelIdParam!) || [];
                    chatSignalRStore.messages.set(channelIdParam!, [...currentMessages, newMessage]);
                }

            } else {
                const messageDto = {
                    messageId: crypto.randomUUID(),
                    content: message,
                    createdAt: new Date().toISOString(),
                    channelId: channelIdParam!,
                    senderId: userStore.user?.id!,
                    senderName: userStore.user?.username!,
                    reaction: "",
                };

                await chatSignalRStore.sendMessage(messageDto, channelIdParam!, serverId!);
            }

      
            setMessage("");
            setFiles(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };
    /*
    const handleSubmit = async () => {
        if ((!message || message.trim() === '') && (!files || files.length === 0)) return;

        try {
            if (files && files.length > 0) {
                // U¿yj endpoint messageattachments/send do wys³ania wiadomoœci z za³¹cznikami
                const formData = new FormData();
                formData.append('content', message);
                formData.append('channelId', channelIdParam!);
                formData.append('senderId', userStore.user?.id!);

                for (let i = 0; i < files.length; i++) {
                    formData.append('files', files[i]);
                }

                await fetch('http://localhost:5000/api/MessageAttachments/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });


            } else {
                // Jeœli nie ma za³¹czników, wyœlij normaln¹ wiadomoœæ przez SignalR
                const messageDto = {
                    messageId: crypto.randomUUID(),
                    content: message,
                    createdAt: new Date().toISOString(),
                    channelId: channelIdParam!,
                    senderId: userStore.user?.id!,
                    senderName: userStore.user?.username!,
                    reaction: "",
                };

                await signalRStore.sendMessage(messageDto, channelIdParam!, serverId!);
            }

            // Clear the form
            setMessage("");
            setFiles(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error("Error sending message with attachments:", error);
        }
    };*/

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(e.target.files);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <Box
            display="flex"
            alignItems="center"
            gap={1.5}
            sx={{
                backgroundColor: '#40444b',
                borderRadius: '8px',
                p: '0px 10px',
                minHeight: '44px',
                boxSizing: 'border-box'
            }}
        >
            <IconButton
                onClick={triggerFileInput}
                size="medium"
                sx={{
                    color: '#b9bbbe',
                    p: '8px',
                    '&:hover': {
                        color: '#dcddde',
                        backgroundColor: 'transparent'
                    }
                }}
                title="Attach files"
            >
                <AttachFileIcon sx={{ fontSize: '24px' }} />
            </IconButton>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                multiple
            />
            {files && files.length > 0 && (
                <Box sx={{ color: '#b9bbbe', fontSize: '0.875rem', mr: 1, whiteSpace: 'nowrap' }}>
                    {files.length} file{files.length > 1 ? 's' : ''} selected
                </Box>
            )}
            <TextField
                fullWidth
                multiline
                maxRows={5}
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                    }
                }}
                variant="standard"
                InputProps={{
                    disableUnderline: true,
                    sx: {
                        color: '#dcddde',
                        fontSize: '0.9375rem',
                        lineHeight: '1.375rem',
                        py: '9px',
                        pr: '0px'
                    }
                }}
                sx={{
                    flexGrow: 1,
                    '& .MuiInputBase-root': {
                        padding: 0,
                    },
                }}
            />
            <IconButton
                onClick={handleSubmit}
                disabled={(!message || message.trim() === '') && (!files || files.length === 0)}
                size="medium"
                sx={{
                    color: (message.trim() || (files && files.length > 0)) ? '#b9bbbe' : '#72767d',
                    p: '8px',
                    '&:hover': {
                        color: (message.trim() || (files && files.length > 0)) ? '#5865f2' : '#8e9297',
                        backgroundColor: 'transparent'
                    },
                    '&.Mui-disabled': {
                        color: '#4f545c'
                    }
                }}
                title="Send message"
            >
                <SendIcon sx={{ fontSize: '24px' }} />
            </IconButton>
        </Box>
    );
});