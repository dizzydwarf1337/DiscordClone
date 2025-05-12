import React from "react";
import { observer } from "mobx-react-lite";
import { Box, Button, Typography, Modal } from "@mui/material";
import { useStore } from "../../../../app/stores/store";

const IncomingCallModal = observer(() => {
    const { signalRStore, userStore } = useStore();

    const isReceiver = signalRStore.currentCall?.targetId === userStore.user?.id;

    const handleAccept = () => {
        if (signalRStore.currentCall?.callerId) {
            signalRStore.acceptCall(signalRStore.currentCall.callerId);
        }
    };

    const handleDecline = () => {
        if (signalRStore.currentCall?.callerId) {
            signalRStore.declineCall(signalRStore.currentCall.callerId);
        }
    };

    return (
        <Modal
            open={!!signalRStore.currentCall && isReceiver} 
            onClose={handleDecline}
            aria-labelledby="incoming-call-title"
            aria-describedby="incoming-call-description"
        >
            {signalRStore.currentCall?.callerId == userStore.getUser()?.id ? (

                <Box sx={{ textAlign: "center", color: "gray", mt: 2 }}>
                    Ringing...
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => signalRStore.declineCall(signalRStore.currentCall!.targetId)}
                        sx={{ ml: 2 }}
                    >
                        Cancel
                    </Button>
                </Box>
            ): (
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 300,
                    bgcolor: "background.paper",
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2,
                    textAlign: "center",
                }}
            >
                <Typography id="incoming-call-title" variant="h6" component="h2">
                    Incoming Call
                </Typography>
                <Typography id="incoming-call-description" sx={{ mt: 2 }}>
                    {`User ${signalRStore.currentCall?.callerId} is calling you.`}
                </Typography>
                <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
                    <Button variant="contained" color="success" onClick={handleAccept}>
                        Accept
                    </Button>
                    <Button variant="contained" color="error" onClick={handleDecline}>
                        Decline
                    </Button>
                </Box>
                    </Box>
            )}
        </Modal>
    );
});

export default IncomingCallModal;