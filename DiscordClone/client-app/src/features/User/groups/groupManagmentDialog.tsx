import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogActions, DialogContent, TextField, Button, List, ListItem, ListItemText,
    IconButton, Typography, Box, Avatar, Divider, ListItemAvatar// Added Typography, Box, Avatar, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add'; // For Add Member button
import SaveIcon from '@mui/icons-material/Save'; // For Save Name button
import { User } from '../../../app/Models/user';
import agent from '../../../app/API/agent';
import { useStore } from '../../../app/stores/store';
import { UpdateGroupNameDto } from '../../../app/Models/UpdateGroupDto'; // Assuming correct path

interface Group {
    id: string;
    name: string;
    isOwner: boolean; // Assuming this is present or determined
    members: User[];
}

interface GroupManagementDialogProps {
    isOpen: boolean;
    group: Group;
    onClose: () => void;
    onSave: () => void; // This will be called after name change, and on overall close
}

export default function GroupManagementDialog({
    isOpen,
    group,
    onClose,
    onSave
}: GroupManagementDialogProps) {
    const { userStore, friendStore } = useStore();
    const [groupName, setGroupName] = useState<string>('');
    const [members, setMembers] = useState<User[]>([]);
    const [newMemberUsername, setNewMemberUsername] = useState<string>('');

    useEffect(() => {
        if (!isOpen) return;
        setGroupName(group.name);
        const loadGroupMembers = async () => {
            try {
                const loadedMembers = await friendStore.getGroupMembers(group.id);
                if (Array.isArray(loadedMembers)) {
                    const filteredMembers = loadedMembers.filter(member => member.id !== userStore.user?.id);
                    setMembers(filteredMembers);
                } else {
                    setMembers([]);
                }
            } catch (error) { setMembers([]); }
        };
        loadGroupMembers();
    }, [isOpen, group, userStore.user?.id, friendStore]);

    const handleAddMember = async () => {
        if (!newMemberUsername.trim()) return;

        try {
            const userToAdd = await agent.Users.getUserByUserName(newMemberUsername.trim());
            if (!userToAdd) {
                alert('User not found.');
                return;
            }

            const isAlreadyMember = members.some(
                (member) => member.username === userToAdd.data.username
            );

            if (isAlreadyMember) {
                alert('User is already in the group.');
                return;
            }

            await friendStore.addFriendToGroup(group.id, userToAdd.data.id);
            setMembers([...members, userToAdd.data]);
            setNewMemberUsername('');
        } catch (error) {
            console.error('Error fetching user:', error);
            alert('User not found or server error.');
        }
    };

    const handleRemoveMember = async (member: User) => {
        if (member.id === userStore.user?.id) {
            alert("You can't remove yourself from the group.");
            return;
        }

        try {
            const response = await friendStore.leaveFromGroup(group.id, member.id);
        } catch (error) {
            console.log(error);
        } finally {
            setMembers(members.filter((m) => m.username !== member.username));
        }
    };
    const handleChangeGroupName = async () => {
        try {
            if (!groupName.trim()) { alert('Group name cannot be empty.'); return; }
            const updateGroupName: UpdateGroupNameDto = { GroupId: group.id, GroupName: groupName };
            await agent.Friends.UpdateGroupName(updateGroupName);
            onSave();
        } catch (error) { alert('Failed to update group name.'); }
    };
    const handleDialogCloseAndSave = async () => {
        onSave();
        onClose();
    };

    const getAvatarLetter = (name?: string) => (name?.[0] || '?').toUpperCase();

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    bgcolor: '#313338', color: '#dcddde', borderRadius: '5px',
                    maxHeight: 'calc(100vh - 80px)',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 0 0 1px rgba(18,19,20,0.3), 0 2px 10px 0 rgba(18,19,20,0.2)',
                    overflow: 'hidden'
                }
            }}
        >
            <Box sx={{ p: '16px 20px', borderBottom: '1px solid #202225', flexShrink: 0, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#f2f3f5' }}>
                    Manage '{group.name}'
                </Typography>
            </Box>

            <DialogContent sx={{ p: '20px', overflowY: 'auto', color: '#b9bbbe' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', mb: '24px', mt: '8px' }}>
                    <TextField
                        placeholder="Group Name"
                        variant="filled"
                        fullWidth
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
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
                    />
                    <Button
                        variant="contained"
                        onClick={handleChangeGroupName}
                        size="small"
                        disabled={groupName === group.name || !groupName.trim()}
                        sx={{
                            minWidth: 'auto', p: '6px 12px', height: '40px',
                            bgcolor: '#5865f2', color: 'white', textTransform: 'none', fontSize: '0.875rem',
                            '&:hover': { bgcolor: '#4752c4' },
                            '&.Mui-disabled': { bgcolor: '#40444b', color: '#72767d' }
                        }}
                        startIcon={<SaveIcon />}
                    >
                        Save
                    </Button>
                </Box>

                <Divider sx={{ borderColor: '#3f4147', mb: '16px' }} />

                <Typography variant="body2" sx={{ fontWeight: 600, color: '#f2f3f5', mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Add New Member
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', mb: '24px' }}>
                    <TextField
                        placeholder="Enter username to add"
                        variant="filled"
                        fullWidth
                        value={newMemberUsername}
                        onChange={(e) => setNewMemberUsername(e.target.value)}
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
                    />
                    <Button
                        variant="contained"
                        onClick={handleAddMember}
                        size="small"
                        disabled={!newMemberUsername.trim()}
                        sx={{
                            minWidth: 'auto', p: '6px 12px', height: '40px',
                            bgcolor: '#5865f2', color: 'white', textTransform: 'none', fontSize: '0.875rem',
                            '&:hover': { bgcolor: '#4752c4' },
                            '&.Mui-disabled': { bgcolor: '#40444b', color: '#72767d' }
                        }}
                        startIcon={<AddIcon />}
                    >
                        Add
                    </Button>
                </Box>

                <Divider sx={{ borderColor: '#3f4147', mb: '16px' }} />

                <Typography variant="body2" sx={{ fontWeight: 600, color: '#f2f3f5', mb: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    Current Members ({members.length})
                </Typography>
                <List sx={{ maxHeight: '200px', overflowY: 'auto', bgcolor: '#2b2d31', borderRadius: '4px', p: 0 }}>
                    {members.map((member, index) => (
                        <ListItem
                            key={member.id || `${member.username}-${index}`}
                            disablePadding
                            secondaryAction={
                                group.isOwner && // Only group owner can remove members (example logic)
                                <IconButton
                                    edge="end"
                                    aria-label="delete"
                                    onClick={() => handleRemoveMember(member)}
                                    sx={{ color: '#b9bbbe', '&:hover': { color: '#f04747', backgroundColor: 'rgba(240,71,71,0.1)' } }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            }
                            sx={{
                                p: '4px 12px',
                                borderBottom: index < members.length - 1 ? '1px solid #3f4147' : 'none',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                            }}
                        >
                            <ListItemAvatar sx={{ minWidth: '40px' }}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }} src={member.image || undefined}>
                                    {!member.image && getAvatarLetter(member.username)}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={member.username}
                                primaryTypographyProps={{ sx: { color: '#f2f3f5', fontWeight: 500 } }}
                            />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>

            <DialogActions sx={{ p: '16px 20px', backgroundColor: '#2f3136', borderTop: '1px solid #202225', justifyContent: 'flex-end' }}>
                {/* Reverting to your original "handleSave" which also closes */}
                <Button
                    onClick={handleDialogCloseAndSave}
                    variant="contained"
                    sx={{
                        bgcolor: '#5865f2', color: 'white', fontWeight: 500,
                        fontSize: '0.875rem', padding: '8px 16px',
                        textTransform: 'none', '&:hover': { bgcolor: '#4752c4' }
                    }}
                >
                    Done
                </Button>
            </DialogActions>
        </Dialog>
    );
}