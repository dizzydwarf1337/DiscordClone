import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, CallEnd, VolumeUp, VolumeOff } from "@mui/icons-material";
import { Box, Grid, IconButton, Typography, Paper, CircularProgress, Tooltip } from "@mui/material";
import { useStore } from "../../../app/stores/store";
import agent from "../../../app/API/agent";
import { User } from "../../../app/Models/user";

export default observer(function GroupCallSection() {
    const { callStore } = useStore();
    const [muted, setMuted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [remoteVolumes, setRemoteVolumes] = useState<Record<string, boolean>>({});

    const localAudioRef = useRef<HTMLAudioElement>(null);
    const remoteRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

    // Initialize call and handle errors
    useEffect(() => {
        const initializeCall = async () => {
            try {
                setLoading(true);
                await callStore.initLocalStream();
                setError(null);
            } catch (err) {
                console.error("Failed to initialize call:", err);
                setError("Failed to access microphone. Please check permissions.");
            } finally {
                setLoading(false);
            }
        };

        initializeCall();

        return () => {
            // Cleanup if component unmounts
            if (!callStore.currentCall) {
                callStore.localStream?.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Setup local audio stream
    useEffect(() => {
        if (localAudioRef.current && callStore.localStream) {
            localAudioRef.current.srcObject = callStore.localStream;
        }
    }, [callStore.localStream]);

    // Toggle mute function with better feedback
    const toggleMute = () => {
        if (callStore.localStream) {
            const newMutedState = !muted;
            callStore.localStream.getAudioTracks().forEach(track => {
                track.enabled = newMutedState;
            });
            setMuted(newMutedState);
        }
    };

    // Toggle remote user volume
    const toggleRemoteVolume = (userId: string) => {
        const audioElement = remoteRefs.current.get(userId);
        if (audioElement) {
            audioElement.muted = !audioElement.muted;
            setRemoteVolumes(prev => ({
                ...prev,
                [userId]: !audioElement.muted
            }));
        }
    };

    // Remote audio component with better error handling
    function RemoteAudio({ userId, stream }: { userId: string; stream: MediaStream }) {
        const audioRef = useRef<HTMLAudioElement>(null);
        const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio && audio.srcObject !== stream) {
            audio.srcObject = stream;
            audio.muted = false;  
            audio.volume = 1;  
            remoteRefs.current.set(userId, audio);

            setRemoteVolumes(prev => {
                if (prev[userId] === undefined) {
                    return { ...prev, [userId]: true };
                }
                return prev;
            });
        }
        agent.Users.getUserById(userId).then(response => {
        if (response.success) {
                setUser(response.data);
            }
        }
        ).catch(err => {
            console.error(`Failed to fetch user ${userId}:`, err);
            setUser(null);
        });
    }, [stream, userId]);

        return (
            <Grid item xs={12} sm={6} md={4} lg={3}>
                <Paper sx={{ 
                    p: 2, 
                    textAlign: "center", 
                    bgcolor: "#2c2c2c",
                    position: "relative"
                }} elevation={3}>
                    <audio
                        ref={audioRef}
                        autoPlay
                        playsInline
                        style={{ width: "100%",/* display: "none"*/ }} // Hidden but still playing
                    />
                    <Typography variant="subtitle1" mt={1}>
                        {user ? user.username : "Unknown User"}
                    </Typography>
                    <Box sx={{ 
                        position: "absolute", 
                        top: 8, 
                        right: 8,
                        display: "flex",
                        gap: 1
                    }}>
                        <Tooltip title={remoteVolumes[userId] ? "Mute user" : "Unmute user"}>
                            <IconButton 
                                size="small" 
                                onClick={() => toggleRemoteVolume(userId)}
                                sx={{ color: remoteVolumes[userId] ? "primary.main" : "error.main" }}
                            >
                                {remoteVolumes[userId] ? <VolumeUp fontSize="small" /> : <VolumeOff fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Paper>
            </Grid>
        );
    }

    const renderContent = () => {
        if (loading) {
            return (
                <Box sx={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    height: "100%",
                    gap: 2
                }}>
                    <CircularProgress />
                    <Typography>Setting up your microphone...</Typography>
                </Box>
            );
        }

        if (error) {
            return (
                <Box sx={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    height: "100%",
                    gap: 2,
                    textAlign: "center",
                    p: 3
                }}>
                    <Typography color="error">{error}</Typography>
                    <Typography variant="body2">
                        Please check your microphone permissions and refresh the page.
                    </Typography>
                </Box>
            );
        }

        return (
            <>
                <Grid container spacing={2} sx={{ p: 2, flex: 1, overflowY: "auto" }}>
                    {/* Local User */}
                    {callStore.localStream && (
                        <Grid item xs={12} sm={6} md={4} lg={3}>
                            <Paper sx={{ 
                                p: 2, 
                                textAlign: "center", 
                                bgcolor: "#2c2c2c",
                                border: muted ? "2px solid #f44336" : "2px solid #4caf50"
                            }} elevation={3}>
                                <audio
                                    ref={localAudioRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    style={{ width: "100%", display: "none" }}
                                />
                                <Typography variant="subtitle1" mt={1}>
                                    You {muted && "(Muted)"}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    {/* Remote Users */}
                    {Array.from(callStore.remoteStreams.entries()).map(([userId, stream]) => (
                        <RemoteAudio key={userId} userId={userId} stream={stream} />
                    ))}

                    {callStore.remoteStreams.size === 0 && (
                        <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                            <Typography variant="body1" color="textSecondary">
                                Waiting for other participants to join...
                            </Typography>
                        </Grid>
                    )}
                </Grid>

                {/* Controls */}
                <Box sx={{ 
                    p: 2, 
                    bgcolor: "#1e1e1e", 
                    display: "flex", 
                    justifyContent: "center", 
                    gap: 3,
                    borderTop: "1px solid #333"
                }}>
                    <Tooltip title={muted ? "Unmute" : "Mute"}>
                        <IconButton 
                            onClick={toggleMute} 
                            color={muted ? "error" : "primary"}
                            sx={{ 
                                width: 56, 
                                height: 56,
                                bgcolor: muted ? "rgba(244, 67, 54, 0.1)" : "rgba(25, 118, 210, 0.1)"
                            }}
                        >
                            {muted ? <MicOff fontSize="large" /> : <Mic fontSize="large" />}
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Leave call">
                        <IconButton 
                            onClick={() => callStore.leaveCall()} 
                            color="error"
                            sx={{ 
                                width: 56, 
                                height: 56,
                                bgcolor: "rgba(244, 67, 54, 0.1)"
                            }}
                        >
                            <CallEnd fontSize="large" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </>
        );
    };

    return (
        <Box sx={{ 
            height: "100%", 
            bgcolor: "#121212", 
            color: "white", 
            display: "flex", 
            flexDirection: "column",
            borderRadius: 1,
            overflow: "hidden"
        }}>
            {renderContent()}
        </Box>
    );
});