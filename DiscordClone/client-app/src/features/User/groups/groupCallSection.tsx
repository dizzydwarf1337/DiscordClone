import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import {
    Mic,
    MicOff,
    Videocam,
    VideocamOff,
    CallEnd,
} from "@mui/icons-material";
import {
    Box,
    Grid,
    IconButton,
    Typography,
    Avatar,
    Paper,
    Stack,
} from "@mui/material";
import { useStore } from "../../../app/stores/store";

export default observer(function GroupCallSection() {
    const { callStore } = useStore();
    const [muted, setMuted] = useState(false);
    const [video, setVideo] = useState(true);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteRefs = useRef<Map<string, HTMLMediaElement>>(new Map());

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
        // Attach local stream to video element
        if (localVideoRef.current && callStore.localStream) {
            localVideoRef.current.srcObject = callStore.localStream;
        }
    }, [callStore.localStream]);

    useEffect(() => {
        // Attach remote streams
        callStore.remoteStreams.forEach((stream, userId) => {
            const ref = remoteRefs.current.get(userId);
            if (ref && ref.srcObject !== stream) {
                ref.srcObject = stream;
            }
        });
    }, [callStore.remoteStreams]);

    const renderRemoteVideos = () => {
        const entries = Array.from(callStore.remoteStreams.entries());
        return entries.map(([userId, stream]) => (
            <Grid item xs={6} md={3} key={userId}>
                <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#2c2c2c" }} elevation={2}>
                    <audio
                        ref={(el) => { 
                            if (el) {
                                remoteRefs.current.set(userId, el); 
                                el.srcObject = stream;
                            }
                        }}
                        autoPlay
                        playsInline
                        style={{ width: "100%" }}
                    />
                    <Typography variant="subtitle1" mt={1}>
                        User {userId}
                    </Typography>
                </Paper>
            </Grid>
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
            {/* User Grid */}
            <Grid container spacing={2} sx={{ p: 2, flex: 1, overflowY: "auto" }}>
                {/* Local User */}
                {callStore.localStream && (
                    <Grid item xs={6} md={3}>
                        <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#2c2c2c" }} elevation={2}>
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                style={{ width: "100%", borderRadius: "8px" }}
                            />
                            <Typography variant="subtitle1" mt={1}>
                                You
                            </Typography>
                        </Paper>
                    </Grid>
                )}

                {/* Remote Users */}
                {renderRemoteVideos()}
            </Grid>

            {/* Controls */}
            <Box sx={{ p: 2, bgcolor: "#1e1e1e", display: "flex", justifyContent: "center", gap: 3 }}>
            <IconButton onClick={toggleMute} color="primary">
                {muted ? <MicOff /> : <Mic />}
            </IconButton>
                <IconButton onClick={() => setVideo(!video)} color="primary">
                    {video ? <Videocam /> : <VideocamOff />}
                </IconButton>
                <IconButton onClick={() => callStore.leaveCall()} color="error">
                    <CallEnd />
                </IconButton>
            </Box>
        </Box>
    );
});
