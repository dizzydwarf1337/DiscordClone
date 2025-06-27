import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import PrivateMessage from "../../../app/Models/PrivateMessage";
import { useStore } from "../../../app/stores/store";

export interface Props {
    message: PrivateMessage;
}

export default function PrivateChatMessage({ message }: Props) {
    const { userStore } = useStore();
    const currentLoggedInUserId = userStore.user?.id;
    const isOwnMessage = message.senderId === currentLoggedInUserId;

    const formatDisplayDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString([], {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
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
                    {formatDisplayDateTime(message.sentAt)}
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