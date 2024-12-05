import { observer } from "mobx-react-lite"
import { useStore } from "../../../app/stores/store";
import { Box } from "@mui/material";
import Message from "./message";
import MessageTextField from "./MessageTextField";


export default observer(function DefaultServer() {
    const { signalRStore } = useStore();

    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="flex-start"
            alignItems="center"
            height="100vh"
            width="100%"
            position="relative"
            overflow="hidden"
            sx={{ p:"100px 0 0 50px" }}
        >
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                width="100%"

                padding="1rem"
            >
                {signalRStore.messages.map((message) => (
                    <Message key={message.messageId} message={message} />
                ))}
            </Box>

            <Box
                display="flex"
                flexDirection="row"
                justifyContent="center"
                alignItems="center"
                width="100%"
                p="0 0 0 50px"

            >
                <MessageTextField />
            </Box>
        </Box>
    );
});
