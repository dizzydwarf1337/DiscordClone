import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, CallEnd } from "@mui/icons-material";
import { Box, Grid, IconButton, Typography, Paper } from "@mui/material";
import { useStore } from "../../../app/stores/store";

export default observer(function GroupCallSection() {
    const { callStore } = useStore();
    const [muted, setMuted] = useState(false);

    const localAudioRef = useRef<HTMLAudioElement>(null);
    const remoteRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

    useEffect(() => {
        callStore.initLocalStream()
            .then(stream => {
                console.log("Local stream ready", stream);
            })
            .catch(err => {
                console.error("Failed to get local media", err);
            });
    }, []);

    useEffect(() => {
        if (localAudioRef.current && callStore.localStream) {
            localAudioRef.current.srcObject = callStore.localStream;
        }
    }, [callStore.localStream]);

    useEffect(() => {
        callStore.remoteStreams.forEach((stream, userId) => {
            const ref = remoteRefs.current.get(userId);
            if (ref && ref.srcObject !== stream) {
                ref.srcObject = stream;
            }
        });
    }, [callStore.remoteStreams]);

    function RemoteAudio({ userId, stream }: { userId: string; stream: MediaStream }) {
        const audioRef = useRef<HTMLAudioElement>(null);

        useEffect(() => {
            if (audioRef.current && audioRef.current.srcObject !== stream) {
                audioRef.current.srcObject = stream;
            }
        }, [stream]);

        return (
            <Grid item xs={6} md={3}>
                <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#2c2c2c" }} elevation={2}>
                    <audio
                        ref={audioRef}
                        autoPlay
                        playsInline
                        controls
                        style={{ width: "100%" }}
                    />
                    <Typography variant="subtitle1" mt={1}>
                        User {userId}
                    </Typography>
                </Paper>
            </Grid>
        );
    }

    const renderRemoteAudios = () => {
        return Array.from(callStore.remoteStreams.entries()).map(([userId, stream]) => (
            <RemoteAudio key={userId} userId={userId} stream={stream} />
        ));
    };

    const toggleMute = () => {
        if (callStore.localStream) {
            callStore.localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setMuted(!muted);
        }
    };

    return (
        <Box sx={{ height: "100%", bgcolor: "#121212", color: "white", display: "flex", flexDirection: "column" }}>
            <Grid container spacing={2} sx={{ p: 2, flex: 1, overflowY: "auto" }}>
                {/* Local User */}
                {callStore.localStream && (
                    <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#2c2c2c" }} elevation={2}>
                            <audio
                                ref={localAudioRef}
                                autoPlay
                                muted
                                playsInline
                                style={{ width: "100%" }}
                            />
                            <Typography variant="subtitle1" mt={1}>
                                You
                            </Typography>
                        </Paper>
                    </Grid>
                )}

                {/* Remote Users */}
                {renderRemoteAudios()}
            </Grid>

            {/* Controls */}
            <Box sx={{ p: 2, bgcolor: "#1e1e1e", display: "flex", justifyContent: "center", gap: 3 }}>
                <IconButton onClick={toggleMute} color="primary">
                    {muted ? <MicOff /> : <Mic />}
                </IconButton>
                <IconButton onClick={() => callStore.leaveCall()} color="error">
                    <CallEnd />
                </IconButton>
            </Box>
        </Box>
    );
});
