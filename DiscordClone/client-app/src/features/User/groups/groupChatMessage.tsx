import GroupMessage from "../../../app/Models/GroupMessage";
import { Box, Typography, IconButton } from "@mui/material";

export interface Props {
    message: GroupMessage;
}

export default function GroupChatMessage({ message }: Props) {
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
         </Box>
    );
}