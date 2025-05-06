import { useState, useEffect } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import FavoriteIcon from "@mui/icons-material/Favorite";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import axios from "axios";

export interface Attachment {
    attachmentId: string;
    url: string;
    fileType: string;
}

export interface Props {
    message: {
        messageId: string;
        content: string;
        createdAt: string;
        senderId: string;
        senderName: string;
        channelId?: string;
        reactions: Array<{ userId: string; reactionType: string }>;
        attachments?: Array<{
            attachmentId: string;
            attachmentUrl: string;
            attachmentType: string;
        }>;
    };
    userId: string;
}

const Message = ({ message, userId }: Props) => {
    const [showReactions, setShowReactions] = useState(false);
    const [reactions, setReactions] = useState<string[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    useEffect(() => {
        // Set initial reactions
        setReactions(message.reactions.map((reaction) => reaction.reactionType));

        // Set attachments from message prop
        if (message.attachments && message.attachments.length > 0) {
            setAttachments(
                message.attachments.map((att) => ({
                    attachmentId: att.attachmentId,
                    url: `http://localhost:5000${att.attachmentUrl}`, // Prepend base URL
                    fileType: att.attachmentType.toLowerCase(),
                }))
            );
        }
    }, [message]);

    const handleReactionClick = async (reaction: string) => {
        try {
            const hasReacted = reactions.includes(reaction);

            // Optimistic update
            setReactions((prevReactions) =>
                hasReacted
                    ? prevReactions.filter((r) => r !== reaction)
                    : [...prevReactions, reaction]
            );

            const response = await fetch(
                `http://localhost:5000/api/message/reaction/${hasReacted ? "remove" : "add"}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        MessageId: message.messageId,
                        UserId: userId,
                        ReactionType: reaction,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to update reaction");
            }

            // Optionally refresh reactions
            const updatedReactionsResponse = await fetch(
                `http://localhost:5000/api/message/${message.messageId}/reactions`
            );
            if (updatedReactionsResponse.ok) {
                const updatedReactions = await updatedReactionsResponse.json();
                setReactions(updatedReactions);
            }
        } catch (error) {
            console.error("Error updating reaction:", error);
        }
    };

    const isMyMessage = message.senderId === userId;

    const renderAttachment = (attachment: Attachment) => {
        switch (attachment.fileType) {
            case "image":
                return (
                    <Box
                        component="img"
                        src={attachment.url}
                        alt="Attachment"
                        sx={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px", mt: 1 }}
                    />
                );
            case "document":
                return (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ color: "#e0e0e0" }}>
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                Document
                            </a>
                        </Typography>
                    </Box>
                );
            default:
                return (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ color: "#e0e0e0" }}>
                            <a href={attachment.url} download>
                                Download File
                            </a>
                        </Typography>
                    </Box>
                );
        }
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            borderRadius="10px"
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            sx={{
                position: "relative",
                padding: "10px",
            }}
        >
            <Box display="flex" flexDirection="column">
                <Typography variant="body2" sx={{ fontWeight: "bold", color: "#fff" }}>
                    {message.senderName}
                </Typography>
                <Typography variant="body2" sx={{ color: "#b0b3b8", fontSize: "0.9rem" }}>
                    {new Date(message.createdAt).toLocaleString()}
                </Typography>
            </Box>
            <Box>
                <Typography
                    variant="body1"
                    sx={{ color: "#e0e0e0", wordBreak: "break-word", whiteSpace: "pre-line" }}
                >
                    {message.content}
                </Typography>
            </Box>

            {attachments.length > 0 && (
                <Box sx={{ mt: 1 }}>
                    {attachments.map((attachment) => (
                        <Box key={attachment.attachmentId}>{renderAttachment(attachment)}</Box>
                    ))}
                </Box>
            )}

            {reactions.length > 0 && (
                <Box sx={{ display: "flex", justifyContent: "end", gap: "8px", paddingTop: "5px" }}>
                    {reactions.map((reaction, index) => (
                        <Typography key={index} variant="body2" sx={{ color: "#ff0", fontSize: "1.5rem" }}>
                            {reaction}
                        </Typography>
                    ))}
                </Box>
            )}

            {showReactions && (
                <Box
                    display="flex"
                    position="absolute"
                    bottom="-40px"
                    justifyContent="space-around"
                    bgcolor="#333"
                    borderRadius="20px"
                    padding="5px"
                >
                    <IconButton onClick={() => handleReactionClick("😊")} size="small" sx={{ color: "#fff" }}>
                        <EmojiEmotionsIcon />
                    </IconButton>
                    <IconButton onClick={() => handleReactionClick("👍")} size="small" sx={{ color: "#fff" }}>
                        <ThumbUpIcon />
                    </IconButton>
                    <IconButton onClick={() => handleReactionClick("❤️")} size="small" sx={{ color: "#fff" }}>
                        <FavoriteIcon />
                    </IconButton>
                    <IconButton onClick={() => handleReactionClick("😄")} size="small" sx={{ color: "#fff" }}>
                        <SentimentSatisfiedAltIcon />
                    </IconButton>
                </Box>
            )}
        </Box>
    );
};

export default Message;