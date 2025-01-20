import { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import FavoriteIcon from "@mui/icons-material/Favorite";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import Message from "../../../app/Models/message";

export interface Props {
    message: Message;
}

export default function Message({ message }: Props) {
    const [showReactions, setShowReactions] = useState(false);
    const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

    const handleReactionClick = (reaction: string) => {
        setSelectedReaction(reaction);
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