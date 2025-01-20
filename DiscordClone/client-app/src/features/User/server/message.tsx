import { useState, useEffect } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import FavoriteIcon from "@mui/icons-material/Favorite";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";

export interface Props {
    message: {
        messageId: string;
        content: string;
        createdAt: string;
        senderName: string;
        reactions: Array<{ userId: string; reactionType: string }>;
    };
    userId: string;
}

const Message = ({ message, userId }: Props) => {
    const [showReactions, setShowReactions] = useState(false);
    const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
    const [reactions, setReactions] = useState<string[]>([]);

    useEffect(() => {
        // Set initial reactions from the message prop
        setReactions(message.reactions.map((reaction) => reaction.reactionType));
    }, [message]);

    const handleReactionClick = async (reaction: string) => {
        setSelectedReaction(reaction);

        // Send the reaction to the API
        try {
            const response = await fetch("http://localhost:5000/api/message/reaction/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    MessageId: message.messageId,
                    UserId: userId,
                    ReactionType: reaction,
                } as AddReactionDto),
            });

            const data = await response.json();
            console.log(data);
            if (response.ok) {
                setReactions((prevReactions) => [...prevReactions, reaction]); // Add the reaction to the list
            } else {
                console.error(data.error || "Error adding reaction");
            }
        } catch (error) {
            console.error("Error while adding reaction:", error);
        }
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            width="90%"
            border="solid red 1px"
            borderRadius="10px"
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            sx={{ position: "relative" }}
        >
            <Box display="flex" flexDirection="column" marginRight="15px">
                <Typography variant="body2" sx={{ fontWeight: "bold", color: "#fff" }}>
                    {message.senderName}
                </Typography>
                <Typography variant="body2" sx={{ color: "#b0b3b8", fontSize: "0.9rem" }}>
                    {new Date(message.createdAt).toLocaleString()}
                </Typography>
            </Box>
            <Box>
                <Typography variant="body1" sx={{ color: "#e0e0e0", wordBreak: "break-word", whiteSpace: "pre-line" }}>
                    {message.content}
                </Typography>
            </Box>

            {/* Display selected reaction */}
            {selectedReaction && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "-10px",
                        right: "10px",
                        color: "#ff0",
                        fontSize: "1.5rem",
                    }}
                >
                    {selectedReaction}
                </Box>
            )}

            {/* Display reactions */}
            {reactions.length > 0 && (
                <Box sx={{ display: "flex", justifyContent: "flex-start", gap: "8px", paddingTop: "5px" }}>
                    {reactions.map((reaction, index) => (
                        <Typography key={index} variant="body2" sx={{ color: "#ff0", fontSize: "1.5rem" }}>
                            {reaction} {/* Render the emoji */}
                        </Typography>
                    ))}
                </Box>
            )}

            {/* Reaction buttons */}
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