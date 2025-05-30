import React, { useEffect, useState } from 'react';
import {
    Button, TextField, Dialog, DialogActions, DialogContent,
    Typography, Box
} from '@mui/material';
import { useStore } from "../../../app/stores/store";
import ChannelCreateDto from '../../../app/Models/ChannelCreate';
import HashIcon from '@mui/icons-material/Tag';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

interface AddChannelDialogProps {
    serverId: string | undefined;
    open: boolean;
    onClose: () => void;
    defaultChannelType?: 'text' | 'voice';
}

export default function AddChannelDialog({ serverId, open, onClose, defaultChannelType = 'text' }: AddChannelDialogProps) {
    const { userStore, channelStore } = useStore();
    const [channelName, setChannelName] = useState('');
    const [channelType, setChannelType] = useState<'text' | 'voice'>(defaultChannelType);
    const [channelTopic, setChannelTopic] = useState('');

    useEffect(() => {
        if (open) {
            setChannelType(defaultChannelType);
            setChannelName('');
            setChannelTopic('');
        }
    }, [open, defaultChannelType]);

    const handleCreateChannel = async () => {
        const currentUser = userStore.user;
        if (!currentUser) { alert("You must be logged in."); return; }
        if (!channelName.trim()) { alert("Channel name is required."); return; }
        if (!serverId) { alert("Server ID is undefined."); return; }

        const newChannel: ChannelCreateDto = {
            serverId, name: channelName, channelType, topic: channelType === 'text' ? channelTopic : undefined,
        };
        await channelStore.createChannelApi(newChannel, currentUser.id);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            PaperProps={{
                sx: {
                    bgcolor: '#313338', color: '#dcddde', borderRadius: '5px',
                    minHeight: '350px',
                    maxHeight: 'calc(100vh - 80px)',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 0 0 1px rgba(18,19,20,0.3), 0 2px 10px 0 rgba(18,19,20,0.2)',
                    overflow: 'hidden'
                }
            }}
        >
            <Box sx={{ p: '16px 20px', flexShrink: 0, textAlign: 'center', borderBottom: '1px solid #202225'}}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#f2f3f5' }}>
                    Create Channel
                </Typography>
            </Box>

            <DialogContent sx={{ p: '20px', overflowY: 'auto', color: '#b9bbbe', borderBottom: '1px solid #202225'}}>
                <Box component="form" noValidate autoComplete="off">
                    <Typography variant="overline" sx={{ display: 'block', color: '#b9bbbe', fontWeight: 600, fontSize: '0.65rem', mb: 0.5, mt: 0}}>
                        CHANNEL TYPE
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                        <Button
                            fullWidth onClick={() => setChannelType('text')} variant="outlined"
                            sx={{ justifyContent: 'flex-start', textTransform: 'none', p: 1.5, borderColor: channelType === 'text' ? '#5865f2' : '#4e5058', backgroundColor: channelType === 'text' ? 'rgba(88,101,242,0.1)' : '#2b2d31', '&:hover': { borderColor: channelType === 'text' ? '#5865f2' : '#5c5e66', backgroundColor: channelType === 'text' ? 'rgba(88,101,242,0.15)' : '#35373d', } }}
                            startIcon={<HashIcon sx={{ color: channelType === 'text' ? '#f2f3f5' : '#b9bbbe', mr: 1 }} />}
                        >
                            <Box sx={{ textAlign: 'left' }}>
                                <Typography sx={{ fontWeight: 500, color: channelType === 'text' ? '#f2f3f5' : '#b9bbbe' }}>Text</Typography>
                            </Box>
                        </Button>
                        <Button
                            fullWidth onClick={() => setChannelType('voice')} variant="outlined"
                            sx={{ justifyContent: 'flex-start', textTransform: 'none', p: 1.5, borderColor: channelType === 'voice' ? '#5865f2' : '#4e5058', backgroundColor: channelType === 'voice' ? 'rgba(88,101,242,0.1)' : '#2b2d31', '&:hover': { borderColor: channelType === 'voice' ? '#5865f2' : '#5c5e66', backgroundColor: channelType === 'voice' ? 'rgba(88,101,242,0.15)' : '#35373d', } }}
                            startIcon={<VolumeUpIcon sx={{ color: channelType === 'voice' ? '#f2f3f5' : '#b9bbbe', mr: 1 }} />}
                        >
                            <Box sx={{ textAlign: 'left' }}>
                                <Typography sx={{ fontWeight: 500, color: channelType === 'voice' ? '#f2f3f5' : '#b9bbbe' }}>Voice</Typography>
                            </Box>
                        </Button>
                    </Box>

                    <Typography variant="overline" sx={{ display: 'block', color: '#b9bbbe', fontWeight: 600, fontSize: '0.65rem', mb: 0.5, mt: 2 }}>
                        CHANNEL NAME
                    </Typography>
                    <TextField
                        autoFocus
                        placeholder="new-channel"
                        fullWidth variant="filled" value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        InputLabelProps={{ shrink: true, sx: { display: 'none' } }}
                        InputProps={{
                            startAdornment: <Box sx={{ mr: 0.5, color: '#72767d', padding: '5px 0px 0px 0px' }}>{channelType === 'text' ? <HashIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}</Box>,
                            disableUnderline: true,
                            sx: { backgroundColor: '#202225', color: '#dcddde', borderRadius: '3px', fontSize: '1rem', height: '40px', '& input': { padding: '6px 12px 10px 0px', boxSizing: 'border-box' }, border: '1px solid #202225', '&:hover': { borderColor: '#060607' }, '&.Mui-focused': { borderColor: '#000000' }, }
                        }}
                    />
                    {channelType === 'text' && (
                        <TextField
                            placeholder="Channel Topic (Optional)" fullWidth variant="filled"
                            multiline rows={2} value={channelTopic}
                            onChange={(e) => setChannelTopic(e.target.value)}
                            InputLabelProps={{ shrink: true, sx: { display: 'none' } }}
                            InputProps={{
                                disableUnderline: true,
                                sx: { backgroundColor: '#202225', color: '#dcddde', borderRadius: '3px', fontSize: '0.875rem', p: '10px 12px', border: '1px solid #202225', '&:hover': { borderColor: '#060607' }, '&.Mui-focused': { borderColor: '#000000' }, }
                            }}
                            sx={{ mt: 2 }}
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{
                p: '16px 20px',
                backgroundColor: '#313338',
                justifyContent: 'center'
            }}>
                <Button
                    onClick={handleCreateChannel}
                    variant="contained"
                    disabled={!channelName.trim()}
                    sx={{
                        bgcolor: '#5865f2',
                        color: 'white',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        padding: '10px 60px',
                        whiteSpace: 'nowrap',
                        lineHeight: 'normal',
                        '&:hover': { bgcolor: '#4752c4' },
                        '&.Mui-disabled': { bgcolor: '#40444b', color: '#72767d' }
                    }}
                >
                    Create Channel
                </Button>
            </DialogActions>
        </Dialog>
    );
}