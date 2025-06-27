import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import GroupMessage from "../../../app/Models/GroupMessage";
import { useStore } from "../../../app/stores/store";

export interface Props {
    message: GroupMessage;
}

export default function GroupChatMessage({ message }: Props) {
    const { userStore } = useStore();


    const currentLoggedInUserId = userStore.user?.id;
    const isOwnMessage = message.senderId === currentLoggedInUserId;


    const formatDisplayTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], {
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    };

    return (
        <Box
            sx={{
                display: 'inline-block',
                p: '7px 12px',
                borderRadius: '18px',
                ...(isOwnMessage ?
                    { borderBottomRightRadius: '4px', bgcolor: '#5865f2', color: 'white', textAlign: 'left' } :
                    { borderBottomLeftRadius: '4px', bgcolor: '#3a3c41', color: '#dcddde', textAlign: 'left' }
                ),
                maxWidth: 'calc(100% - 10px)',
            }}
        >
            {!isOwnMessage && (
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: "500",
                        color: "#f2f3f5",
                        lineHeight: '1.125rem',
                        mb: '2px',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                    }}
                >
                    {message.senderName || "User"}
                </Typography>
            )}


            <Box
                sx={{ mb: '3px' }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        color: isOwnMessage ? "rgba(230,230,230,0.7)" : "#949ba4",
                        fontSize: "0.6875rem",
                        lineHeight: '1',
                        display: 'block',
                    }}
                >
                    {new Date(message.sentAt).toLocaleString([], { hour: 'numeric', minute: '2-digit', hour12: true, year: 'numeric', month: 'numeric', day: 'numeric' })}
                </Typography>
            </Box>

            <Box>
                <Typography
                    variant="body1"
                    sx={{
                        color: "inherit",
                        wordBreak: "break-word",
                        whiteSpace: "pre-line",
                        fontSize: '0.9375rem',
                        lineHeight: '1.375rem',
                    }}
                >
                    {message.content}
                </Typography>
            </Box>

        </Box>
    );
}