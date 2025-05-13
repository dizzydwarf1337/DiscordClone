import { observer } from "mobx-react-lite";
import { useState } from "react";
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
    AppBar,
    Toolbar,
} from "@mui/material";

const dummyUsers = [
    { id: 1, name: "Alice", muted: false, video: true },
    { id: 2, name: "Bob", muted: true, video: false },
    { id: 3, name: "Charlie", muted: false, video: false },
    { id: 4, name: "Diana", muted: true, video: true },
];

export default observer(function GroupCallSection() {
    const [muted, setMuted] = useState(false);
    const [video, setVideo] = useState(true);

    return (
        <Box sx={{ height: "100%", bgcolor: "#121212", color: "white", display: "flex", flexDirection: "column" }}>
            {/* User Grid */}
            <Grid container spacing={2} sx={{ p: 2, flex: 1, overflowY: "auto" }}>
                {dummyUsers.map((user) => (
                    <Grid item xs={6} md={3} key={user.id}>
                        <Paper
                            sx={{
                                p: 2,
                                textAlign: "center",
                                bgcolor: "#2c2c2c",
                            }}
                            elevation={2}
                        >
                            <Avatar
                                sx={{
                                    width: 64,
                                    height: 64,
                                    mx: "auto",
                                    mb: 1,
                                    opacity: user.video ? 1 : 0.5,
                                }}
                            >
                                {user.name[0]}
                            </Avatar>
                            <Typography variant="subtitle1">{user.name}</Typography>
                            <Stack direction="row" spacing={1} justifyContent="center" mt={1}>
                                {user.muted ? (
                                    <MicOff color="error" />
                                ) : (
                                    <Mic color="success" />
                                )}
                                {user.video ? (
                                    <Videocam color="success" />
                                ) : (
                                    <VideocamOff color="error" />
                                )}
                            </Stack>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Controls */}
            <Box sx={{ p: 2, bgcolor: "#1e1e1e", display: "flex", justifyContent: "center", gap: 3 }}>
                <IconButton onClick={() => setMuted(!muted)} color="primary">
                    {muted ? <MicOff /> : <Mic />}
                </IconButton>
                <IconButton onClick={() => setVideo(!video)} color="primary">
                    {video ? <Videocam /> : <VideocamOff />}
                </IconButton>
                <IconButton color="error">
                    <CallEnd />
                </IconButton>
            </Box>
        </Box>
    );
});
