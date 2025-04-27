import { useState, useRef } from "react";
import { Box, Button, TextField, IconButton } from "@mui/material";
import { useStore } from "../../../app/stores/store";
import { useParams } from "react-router-dom";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import { observer } from "mobx-react-lite";
import agent from "../../../app/API/agent";


export default observer(function MessageTextField() {
    const { userStore, signalRStore } = useStore();
    const { serverId, channelIdParam } = useParams();
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState<FileList | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);


    const handleSubmit = async () => {
        if ((!message || message.trim() === '') && (!files || files.length === 0)) return;

        try {
            if (files && files.length > 0) {
                const newMessage = await signalRStore.sendMessageWithAttachments(
                    message,
                    channelIdParam!,
                    userStore.user?.id!,
                    files
                );

                if (newMessage) {
                    // Dodaj now¹ wiadomoœæ do stanu
                    const currentMessages = signalRStore.messages.get(channelIdParam!) || [];
                    signalRStore.messages.set(channelIdParam!, [...currentMessages, newMessage]);
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

                await signalRStore.sendMessage(messageDto, channelIdParam!, serverId!);
            }

      

            // Clear the form
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
        <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={triggerFileInput} sx={{ color: 'gray' }}>
                <AttachFileIcon />
            </IconButton>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                multiple
            />
            {files && files.length > 0 && (
                <Box sx={{ color: 'gray', fontSize: '0.8rem' }}>
                    {files.length} file(s) selected
                </Box>
            )}
            <TextField
                fullWidth
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                    }
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '15px',
                        backgroundColor: '#2A2A2A',
                        color: 'white',
                    }
                }}
            />
            <IconButton onClick={handleSubmit} sx={{ color: message || (files && files.length > 0) ? 'primary.main' : 'gray' }}>
                <SendIcon />
            </IconButton>
        </Box>
    );
});