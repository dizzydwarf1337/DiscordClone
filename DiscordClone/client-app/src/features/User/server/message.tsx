import { Box, Typography } from "@mui/material";
import Message from "../../../app/Models/message";

export interface Props {
    message: Message;
}

export default function Message({ message }: Props) {
    return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" width="90%" border="solid red 1px" borderRadius="10px">
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
        </Box>
    );
}
