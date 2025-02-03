import { Box, Typography } from "@mui/material";
import Message from "../../../app/Models/message";
import PrivateMessage from "../../../app/Models/PrivateMessage";

export interface Props {
    message: PrivateMessage;
}

export default function PrivateChatMessage({ message }: Props) {
    return (
        <Box display="flex" flexDirection="column" borderRadius="10px">
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
