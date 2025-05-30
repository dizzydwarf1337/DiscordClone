import { Dialog, DialogActions, DialogContent, TextField, Button, Checkbox, FormControlLabel, FormGroup, Typography, Box, Avatar } from "@mui/material";
import { useEffect, useState } from "react";
import { useStore } from "../../../app/stores/store";
import { CreateGroupDto } from "../../../app/Models/CreateGroupDto";
import { User } from "../../../app/Models/user";

interface CreateGroupDialogProps {
    open: boolean;
    onClose: () => void;
}

export const CreateGroupDialog = ({ open, onClose }: CreateGroupDialogProps) => {
    const [groupName, setGroupName] = useState<string>('');
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const { friendStore, userStore } = useStore();
    const [friends, setFriends] = useState<User[]>([]);

    useEffect(() => {
        if (!open) {
            setGroupName('');
            setSelectedFriends([]);
            return;
        }
        const fetchFriends = async () => {
            if (userStore.user?.id) {
                try {
                    const friendList = await friendStore.getFriends();
                    setFriends(friendList || []);
                } catch (error) {
                    setFriends([]);
                }
            }
        };
        fetchFriends();
    }, [open, userStore.user, friendStore]);

    const handleCreateGroup = async () => {
        if (!userStore.user?.id || !groupName.trim()) return;
        const newGroup: CreateGroupDto = {
            CreatorId: userStore.user.id,
            GroupName: groupName,
        };
        try {
            const response = await friendStore.createFriendGroup(newGroup);
            if (response && response.id && selectedFriends.length > 0) {
                await Promise.all(
                    selectedFriends.map((friendId) =>
                        friendStore.addFriendToGroup(response.id, friendId)
                    )
                );
            }
            onClose();
        } catch (error) { /* console.error if needed */ }
    };

    const handleFriendSelect = (friendId: string) => {
        setSelectedFriends((prev) =>
            prev.includes(friendId)
                ? prev.filter((id) => id !== friendId)
                : [...prev, friendId]
        );
    };

    const getAvatarLetter = (name?: string) => (name?.[0] || '?').toUpperCase();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    bgcolor: '#313338', color: '#dcddde', borderRadius: '5px',
                    width: '440px', maxWidth: '90vw',
                    minHeight: '400px', maxHeight: 'calc(100vh - 40px)',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 0 0 1px rgba(18,19,20,0.3), 0 2px 10px 0 rgba(18,19,20,0.2)',
                    overflow: 'hidden'
                }
            }}
        >
            <Box sx={{ p: '16px 20px', borderBottom: '1px solid #202225', flexShrink: 0, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#f2f3f5' }}>
                    Create New Group
                </Typography>
            </Box>

            <DialogContent sx={{ p: '20px', overflowY: 'auto', color: '#b9bbbe', borderBottom: '1px solid #202225' }}>
                <TextField
                    autoFocus
                    margin="dense"
                    placeholder="Group Name"
                    fullWidth
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    variant="filled"
                    InputLabelProps={{ shrink: true, sx: { display: 'none' } }}
                    InputProps={{
                        disableUnderline: true,
                        sx: {
                            backgroundColor: '#202225', color: '#dcddde', borderRadius: '3px',
                            fontSize: '1rem', height: '40px',
                            '& input': { padding: '10px 12px', boxSizing: 'border-box' },
                            border: '1px solid #202225',
                            '&:hover': { borderColor: '#060607' },
                            '&.Mui-focused': { borderColor: '#000000' },
                        }
                    }}
                    sx={{ mb: 2 }}
                />

                <Typography variant="body2" sx={{ fontWeight: 600, color: '#f2f3f5', mt: "20px", mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Select Members
                </Typography>
                <FormGroup sx={{ maxHeight: '200px', overflowY: 'auto', pr: '4px' }}>
                    {friends.length > 0 ? friends.map((friend) => (
                        <FormControlLabel
                            key={friend.id}
                            control={
                                <Checkbox
                                    checked={selectedFriends.includes(friend.id)}
                                    onChange={() => handleFriendSelect(friend.id)}
                                    sx={{ color: '#72767d', '&.Mui-checked': { color: '#5865f2' }, py: '2px' }}
                                />
                            }
                            label={
                                <Box display="flex" alignItems="center" gap={1.5}>
                                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }} src={friend.image || undefined}>
                                        {!friend.image && getAvatarLetter(friend.username)}
                                    </Avatar>
                                    <Typography variant="body2" sx={{ color: '#dcddde' }}>
                                        {friend.username}
                                    </Typography>
                                </Box>
                            }
                            sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }, borderRadius: '4px', mx: 0, width: '100%', my: '1px' }}
                        />
                    )) : (
                        <Typography variant="caption" sx={{ color: '#8e9297', display: 'block', textAlign: 'center', py: 2 }}>
                            Add some friends to select them for a group!
                        </Typography>
                    )}
                </FormGroup>
            </DialogContent>

            <DialogActions sx={{
                p: '16px 20px',
                backgroundColor: '#313338',
                justifyContent: 'center'
            }}>
                <Button
                    onClick={handleCreateGroup}
                    variant="contained"
                    disabled={!groupName.trim() || selectedFriends.length === 0}
                    sx={{
                        bgcolor: '#5865f2',
                        color: 'white',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        padding: '10px 32px',
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        lineHeight: 'normal',
                        '&:hover': { bgcolor: '#4752c4' },
                        '&.Mui-disabled': { bgcolor: '#40444b', color: '#72767d' }
                    }}
                >
                    Create Group
                </Button>
            </DialogActions>
        </Dialog>
    );
};