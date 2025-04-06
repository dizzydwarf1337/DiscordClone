import { useState, useEffect } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import FavoriteIcon from "@mui/icons-material/Favorite";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import PrivateMessage from "../../../app/Models/PrivateMessage";

export interface Props {
    message: PrivateMessage;
}

export default function PrivateChatMessage({ message }: Props) {
    const [showReactions, setShowReactions] = useState(false);
    const [reactions, setReactions] = useState<string[]>(message.reactions || []);

    useEffect(() => {
        // Ustaw początkowe reakcje z właściwości `message`
        setReactions(message.reactions || []);
    }, [message]);

    const handleReactionClick = async (reaction: string) => {
        try {
            const hasReacted = reactions.includes(reaction);

            // Optymistyczna aktualizacja stanu lokalnego
            setReactions(prev =>
                hasReacted ? prev.filter(r => r !== reaction) : [...prev, reaction]
            );

            const response = await fetch(
                `http://localhost:5000/api/reaction/${hasReacted ? "remove" : "add"}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        MessageId: message.messageId,
                        UserId: localStorage.getItem("userId"),
                        ReactionType: reaction,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to update reaction");
            }

            // Opcjonalnie: Pobierz odświeżone reakcje z serwera
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

    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            width="90%"
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            sx={{ position: "relative" }}
        >
            <Box display="flex" flexDirection="column" marginRight="15px">
                <Typography variant="body2" sx={{ color: "#b0b3b8", fontSize: "0.9rem" }}>
                    {new Date(message.sentAt).toLocaleString()}
                </Typography>
            </Box>
            <Box>
                <Typography variant="body1" sx={{ color: "#e0e0e0", wordBreak: "break-word", whiteSpace: "pre-line" }}>
                    {message.content}
                </Typography>
            </Box>

            {/* Wyświetlanie reakcji */}
            {reactions.length > 0 && (
                <Box sx={{ display: "flex", justifyContent: "flex-start", gap: "8px", paddingTop: "5px" }}>
                    {reactions.map((reaction, index) => (
                        <Typography key={index} variant="body2" sx={{ color: "#ff0", fontSize: "1.5rem" }}>
                            {reaction}
                        </Typography>
                    ))}
                </Box>
            )}

            {/* Przyciski reakcji */}
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
}