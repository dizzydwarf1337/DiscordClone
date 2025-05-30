import { Dialog, Box, Typography, TextField, Button, Checkbox, FormControlLabel } from "@mui/material";
import { useStore } from "../../../app/stores/store";
import { useState, useEffect } from "react";
import { ServerCreateDto } from "../../../app/Models/ServerCreate";
import { observer } from "mobx-react-lite";

interface Props {
    open: boolean;
    onClose: () => void;
}

export default observer(function JoinServerDialog({ open, onClose }: Props) {
    const { serverStore, userStore, chatSignalRStore } = useStore();
    const [join, setJoin] = useState<boolean>(true);
    const [joinServerId, setJoinServerId] = useState<string>("");
    const [serverCreate, setServerCreate] = useState<ServerCreateDto>({
        ownerId: userStore.user?.id || "",
        name: "",
        description: "",
        iconUrl: "",
        isPublic: true,
    });

    useEffect(() => {
        if (open) {
            setJoinServerId("");
            setServerCreate({
                ownerId: userStore.user?.id || "",
                name: "", description: "", iconUrl: "", isPublic: true,
            });
        }
    }, [open, userStore.user]);

    const handleJoin = async () => { if (!userStore.user?.id || !joinServerId.trim()) return; await serverStore.joinServerApi(userStore.user.id, joinServerId); const joinedServer = serverStore.servers.find(x => x.serverId === joinServerId); if (joinedServer) await serverStore.getServersApi(userStore.user.id); onClose(); };
    const handleCreate = async () => { if (!serverCreate.name.trim() || !userStore.user?.id) { alert("Server name is required."); return; } const payload = { ...serverCreate, ownerId: userStore.user.id }; await serverStore.createServerApi(payload); await serverStore.getServersApi(userStore.user.id); onClose(); };

    const commonTextFieldStyles = { variant: "filled", fullWidth: true, InputLabelProps: { shrink: true, sx: { display: 'none' } }, InputProps: { disableUnderline: true, sx: { backgroundColor: '#202225', color: '#dcddde', borderRadius: '3px', fontSize: '1rem', height: '40px', '& input': { padding: '10px 12px', boxSizing: 'border-box' }, border: '1px solid #202225', '&:hover': { borderColor: '#060607' }, '&.Mui-focused': { borderColor: '#000000' }, } }, sx: { mb: 1.5 } };
    const primaryButtonStyles = { bgcolor: '#5865f2', color: 'white', fontWeight: 500, fontSize: '0.875rem', padding: '8px 20px', textTransform: 'none', '&:hover': { bgcolor: '#4752c4' }, '&.Mui-disabled': { bgcolor: '#40444b', color: '#72767d' } };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { bgcolor: '#313338', color: '#dcddde', borderRadius: '5px', width: '440px', maxWidth: '90vw', minHeight: join ? '280px' : '400px', maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', boxShadow: '0 0 0 1px rgba(18,19,20,0.3), 0 2px 10px 0 rgba(18,19,20,0.2)', overflow: 'hidden' } }}
        >
            <Box
                display="flex" flexDirection="column" alignItems="center"
                width="100%"
                sx={{ flexGrow: 1, overflowY: 'auto', boxSizing: 'border-box' }}
            >
                {join ? (
                    <Box display="flex" flexDirection="column" alignItems="stretch" width="100%" p="24px 28px" gap="16px" boxSizing="border-box" sx={{ flexGrow: 1 }}>
                        <Typography variant="h5" sx={{ textAlign: "center", fontWeight: 600, color: '#f2f3f5', mb: 0.5 }}>Join a Server</Typography>
                        <Typography variant="body2" sx={{ color: '#b9bbbe', textAlign: 'center', mb: 1 }}>Enter an server ID below to join an existing server.</Typography>
                        <TextField label="Server ID or Invite Code" placeholder="Enter ID or Code" value={joinServerId} onChange={(e) => setJoinServerId(e.target.value)} {...commonTextFieldStyles} sx={{ ...commonTextFieldStyles.sx, mt: 2 }} />

                        <Box sx={{ flexGrow: 1 }} />
                        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" mt="auto" >
                            <Box sx={{ cursor: "pointer" }} onClick={() => setJoin(false)}>
                                <Typography variant="caption" sx={{ color: '#00a8fc', fontSize: '0.75rem', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' } }} >
                                    Create my own server
                                </Typography>
                            </Box>
                            <Button
                                variant="contained" onClick={handleJoin}
                                disabled={!joinServerId.trim()}
                                sx={{ ...primaryButtonStyles, padding: '6px 60px', whiteSpace: 'nowrap' }}
                            >
                                Join Server
                            </Button>
                        </Box>
                    </Box>
                ) : (
                    <Box display="flex" flexDirection="column" alignItems="stretch" width="100%" p="24px 28px" gap="12px" boxSizing="border-box" sx={{ flexGrow: 1 }}>
                        <Typography variant="h5" sx={{ textAlign: "center", fontWeight: 600, color: '#f2f3f5', mb: 0.5 }}>Create Your Server</Typography>
                        <Typography variant="body2" sx={{ color: '#b9bbbe', textAlign: 'center', mb: 1 }}>Give your new server a personality with a name. You can always change it later.</Typography>
                        <TextField label="Server Name*" placeholder="Server Name*" value={serverCreate.name} onChange={(e) => setServerCreate({ ...serverCreate, name: e.target.value })} {...commonTextFieldStyles} sx={{ ...commonTextFieldStyles.sx, mt: 1 }} />
                        <TextField label="Server Description" placeholder="Server Description (Optional)" value={serverCreate.description} onChange={(e) => setServerCreate({ ...serverCreate, description: e.target.value })} multiline rows={2} {...commonTextFieldStyles} InputProps={{ ...commonTextFieldStyles.InputProps, sx: { ...commonTextFieldStyles.InputProps?.sx, height: 'auto', minHeight: '40px' } }} />
                        <FormControlLabel
                            control={<Checkbox checked={serverCreate.isPublic} onChange={(e) => setServerCreate({ ...serverCreate, isPublic: e.target.checked })} sx={{ color: '#72767d', '&.Mui-checked': { color: '#5865f2' }, py: 0, ml: -0.5 }} />}
                            label={<Typography variant="body2" sx={{ color: '#b9bbbe' }}>Public server </Typography>}
                            sx={{ alignSelf: 'flex-start', mb: 1 }}
                        />
                        <Box sx={{ flexGrow: 1 }} />
                        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" mt="auto" >
                            <Box sx={{ cursor: "pointer" }} onClick={() => setJoin(true)}>
                                <Typography variant="caption" sx={{ color: '#00a8fc', fontSize: '0.75rem', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' } }} >
                                    Join a server.
                                </Typography>
                            </Box>
                            <Button
                                variant="contained" onClick={handleCreate}
                                disabled={!serverCreate.name.trim()}
                                sx={{ ...primaryButtonStyles, padding: '6px 60px', whiteSpace: 'nowrap'}}
                            >
                                Create Server
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>
        </Dialog>
    );
});