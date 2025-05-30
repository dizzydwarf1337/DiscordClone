import React from "react";
import { observer } from "mobx-react-lite";
import { Box, Button, Typography, Modal, Avatar, IconButton } from "@mui/material";
import { useStore } from "../../../../app/stores/store";
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import RingVolumeIcon from '@mui/icons-material/RingVolume';

const IncomingCallModal = observer(() => {
    const { voiceSignalRStore, userStore, friendStore } = useStore();

    const isReceiver = voiceSignalRStore.currentCallInfo?.targetId === userStore.user?.id &&
        !voiceSignalRStore.currentCallInfo?.isInitiator;

    const isInitiatorAndRinging = voiceSignalRStore.currentCallInfo?.callerId === userStore.user?.id &&
        voiceSignalRStore.currentCallInfo?.isInitiator &&
        voiceSignalRStore.isRinging;

    const openCondition = (isReceiver && voiceSignalRStore.isRinging) || isInitiatorAndRinging;

    const callerId = voiceSignalRStore.currentCallInfo?.callerId;
    const targetId = voiceSignalRStore.currentCallInfo?.targetId;

    let otherUserName = "Unknown User";
    let otherUserImage: string | undefined = undefined;

    if (isReceiver && callerId) {
        const callerDetails = friendStore.friends.find(f => f.id === callerId) || userStore.users.get(callerId);
        otherUserName = callerDetails?.username || callerId.substring(0, 8);
        otherUserImage = callerDetails?.image;
    } else if (isInitiatorAndRinging && targetId) {
        const targetDetails = friendStore.friends.find(f => f.id === targetId) || userStore.users.get(targetId);
        otherUserName = targetDetails?.username || targetId.substring(0, 8);
        otherUserImage = targetDetails?.image;
    }

    const getAvatarLetter = (name?: string) => (name?.[0] || '?').toUpperCase();


    const handleAccept = () => {
        if (voiceSignalRStore.currentCallInfo?.callerId) {
            voiceSignalRStore.acceptCall();
        }
    };

    const handleDeclineOrCancel = () => { 
        if (isReceiver && voiceSignalRStore.currentCallInfo?.callerId) {
            voiceSignalRStore.declineCall();
        } else if (isInitiatorAndRinging && voiceSignalRStore.currentCallInfo?.targetId) {
            voiceSignalRStore.endCall();
        }
    };

    return (
        <Modal
            open={openCondition}
            onClose={handleDeclineOrCancel}
            aria-labelledby="call-modal-title"
            aria-describedby="call-modal-description"
            sx={{
                '& .MuiBackdrop-root': {
                    backgroundColor: 'rgba(0,0,0,0.65)'
                }
            }}
        >
            {/* Using a single Box structure, content changes based on isReceiver vs isInitiatorAndRinging */}
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 320,
                    bgcolor: "#2f3136",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.24)",
                    p: '24px',
                    borderRadius: '5px',
                    textAlign: "center",
                    outline: 'none',
                    color: '#dcddde'
                }}
            >
                {isReceiver && voiceSignalRStore.isRinging && (
                    <> {/* Incoming Call UI */}
                        <Avatar
                            src={otherUserImage || undefined}
                            sx={{ width: 80, height: 80, margin: '0 auto 16px auto', fontSize: '2rem' }}
                        >
                            {!otherUserImage && getAvatarLetter(otherUserName)}
                        </Avatar>
                        <Typography id="call-modal-title" variant="h6" component="h2" sx={{ fontWeight: 600, color: 'white', mb: 0.5 }}>
                            Incoming Call
                        </Typography>
                        <Typography id="call-modal-description" sx={{ mt: 0, mb: 3, color: '#b9bbbe' }}>
                            {`${otherUserName} is calling you.`}
                        </Typography>
                        <Box sx={{ mt: 3, display: "flex", justifyContent: "space-around" }}>
                            <Button
                                variant="contained"
                                onClick={handleDeclineOrCancel}
                                sx={{
                                    bgcolor: '#d83c3e', color: 'white', fontWeight: 500,
                                    fontSize: '0.875rem', padding: '8px 20px', textTransform: 'none',
                                    minWidth: '120px',
                                    '&:hover': { bgcolor: '#b02628' }
                                }}
                                startIcon={<CallEndIcon />}
                            >
                                Decline
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleAccept}
                                sx={{
                                    bgcolor: '#3ba55c', color: 'white', fontWeight: 500,
                                    fontSize: '0.875rem', padding: '8px 20px', textTransform: 'none',
                                    minWidth: '120px',
                                    '&:hover': { bgcolor: '#2d7d46' }
                                }}
                                startIcon={<CallIcon />}
                            >
                                Accept
                            </Button>
                        </Box>
                    </>
                )}

                {isInitiatorAndRinging && (
                    <> {/* Outgoing Call / Ringing UI */}
                        <Avatar
                            src={otherUserImage || undefined}
                            sx={{ width: 80, height: 80, margin: '0 auto 16px auto', fontSize: '2rem' }}
                        >
                            {!otherUserImage && getAvatarLetter(otherUserName)}
                        </Avatar>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RingVolumeIcon sx={{ mr: 1, color: '#72767d' }} /> Ringing...
                        </Typography>
                        <Typography sx={{ mt: 0.5, mb: 3, color: '#b9bbbe' }}>
                            Calling {otherUserName}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={handleDeclineOrCancel}
                            sx={{
                                bgcolor: '#d83c3e', color: 'white', fontWeight: 500,
                                fontSize: '0.875rem', padding: '8px 24px', textTransform: 'none',
                                '&:hover': { bgcolor: '#b02628' }
                            }}
                            startIcon={<CallEndIcon />}
                        >
                            Cancel
                        </Button>
                    </>
                )}
            </Box>
        </Modal>
    );
});

export default IncomingCallModal;