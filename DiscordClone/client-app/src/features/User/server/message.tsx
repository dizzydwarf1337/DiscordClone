import { Box, Typography } from "@mui/material";
import ChatMessage from "../../../app/Models/ChatMessage";


export interface Props  {
    message: ChatMessage;
}
export default function Message({message}:Props) {

    console.log(message);
    return (
        <Box display="flex" flexDirection="row" justifyContent="flex-end" alignItems="center" sx={{ borderRadius: "10px", boxShadow: "1px 1px 1px 1px grey", m: "10px", width: "1300px" }}>
            <Box>
                <Typography variant="body2">{message.userName}</Typography> - <Typography variant="body2">{new Date(message.createdAt).toLocaleString()}</Typography>
            </Box>
            <Box>
                <Typography variant="body1">{message.content}</Typography>
            </Box>
            <Box>
                <Typography>{message.isEdited ? "Edited" : ""}</Typography>
            </Box>
        </Box>
    )
}