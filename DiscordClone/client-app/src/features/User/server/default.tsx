import { observer } from "mobx-react-lite"
import { useStore } from "../../../app/stores/store";
import { Box } from "@mui/material";


export default observer(function DefaultServer() {
    const { signalRStore } = useStore();

    return (
        <Box>
            {signalRStore.messages.map((message) => (
                <Box key={message.messageId} sx={{ marginBottom: 2 }}>
                    <Box>{message.content}</Box>
                    <Box>{new Date(message.createdAt).toLocaleString()}</Box>
                </Box>
            ))}
        </Box>
    );
});