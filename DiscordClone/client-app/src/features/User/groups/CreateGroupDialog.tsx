import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, Checkbox, FormControlLabel, FormGroup, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useStore } from "../../../app/stores/store";
import { CreateGroupDto } from "../../../app/Models/CreateGroupDto";
import { User } from "../../../app/Models/user";
import agent from "../../../app/API/agent";

interface CreateGroupDialogProps {
    open: boolean;
    onClose: () => void;
}

export const CreateGroupDialog = ({ open, onClose }: CreateGroupDialogProps) => {
    const [groupName, setGroupName] = useState<string>('');
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]); // Store the selected friends' ids
    const { friendStore } = useStore();
    const { userStore } = useStore();
    const [user, setUser] = useState<User | null>(null);
    const [friends, setFriends] = useState<User[]>([]); // Store all friends

    useEffect(() => {
        const fetchedUser = userStore.getUser();
        setUser(fetchedUser);

        // Fetch the list of friends
        const fetchFriends = async () => {
            const friendList = await friendStore.getFriends(); 
            setFriends(friendList);
        };

        if (fetchedUser) {
            fetchFriends();
        }
    }, [userStore, friendStore]);

    const handleCreateGroup = async () => {
        const newGroup: CreateGroupDto = {
            CreatorId: user!.id,
            GroupName: groupName,
           // FriendIds: selectedFriends, // Add selected friends to the group
        };

        const response = await friendStore.createFriendGroup(newGroup); // Assuming this function handles the API call
        console.log("Group Created:", groupName, "Response:", response);
        //const response2 = await friendStore.(newGroup); // Assuming this function handles the API call
        onClose();
    };

    const handleFriendSelect = (friendId: string) => {
        setSelectedFriends((prev) =>
            prev.includes(friendId)
                ? prev.filter((id) => id !== friendId)
                : [...prev, friendId]
        );
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Create Group</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Group Name"
                    fullWidth
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                />

                <FormGroup>
                    <Typography variant="subtitle2" sx={{ marginTop: "20px" }}>
                        Select Friends to Add to the Group
                    </Typography>
                    {friends.map((friend) => (
                        <FormControlLabel
                            key={friend.id}
                            control={
                                <Checkbox
                                    checked={selectedFriends.includes(friend.id)}
                                    onChange={() => handleFriendSelect(friend.id)}
                                />
                            }
                            label={friend.username}
                        />
                    ))}
                </FormGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleCreateGroup}>Create</Button>
            </DialogActions>
        </Dialog>
    );
};