// AddChannelButton.tsx
import React, { useEffect, useState } from 'react';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useStore } from "../../../app/stores/store";
import ChannelCreateDto from '../../../app/Models/ChannelCreate';
import { User } from '../../../app/Models/user';


interface AddChannelButtonProps {
    serverId: string | undefined;
}

export default function AddChannelButton({serverId}: AddChannelButtonProps) {
    const { userStore } = useStore();
    const [open, setOpen] = useState(false);
    const { channelStore } = useStore();
    const [channelName, setChannelName] = useState('');
    const [channelType, setChannelType] = useState('');
    const [channelTopic, setChannelTopic] = useState('');
    const [user, setUser] = useState<User | null>(null); 

    useEffect(() => {
        const fetchedUser = userStore.getUser();
        setUser(fetchedUser);
    }, [userStore]);


    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setChannelName('');
    };

    const handleCreateChannel = async () => {
        if (channelName.trim()) {
           if (serverId === undefined) {
                alert("Server id is undefined");
                return;
           }
           const newChannel: ChannelCreateDto = {
            serverId: serverId,
            name: channelName,
            channelType: channelType,
            topic: channelTopic,
           };
            await channelStore.createChannelApi(newChannel, user.id); 
            handleClose();
        } else {
            alert("Channel name is required");
        }
    };

    return (
        <>
            <Button variant="contained" color="primary" onClick={handleClickOpen}>
                Add Channel
            </Button>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Add a New Channel</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Channel Name"
                        fullWidth
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Channel Type"
                        fullWidth
                        value={channelType}
                        onChange={(e) => setChannelType(e.target.value)}
                    />
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Channel Topic"
                        fullWidth
                        value={channelTopic}
                        onChange={(e) => setChannelTopic(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleCreateChannel} color="primary">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
