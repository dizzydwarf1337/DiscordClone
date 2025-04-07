import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { User } from '../../../app/Models/user';
import agent from '../../../app/API/agent';
import { useStore } from '../../../app/stores/store';

interface Group {
  id: string;
  name: string;
  isOwner: boolean;
  members: User[];
}

interface GroupManagementDialogProps {
  isOpen: boolean;
  group: Group;
  onClose: () => void;
  onSave: (group: Group) => void;
}

export default function GroupManagementDialog({
  isOpen,
  group,
  onClose,
  onSave
}: GroupManagementDialogProps) {
  const {friendStore} = useStore();
  const [groupName, setGroupName] = useState<string>('');
  const [members, setMembers] = useState<User[]>([]);
  const [newMemberUsername, setNewMemberUsername] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    setGroupName(group.name);
    setMembers(group.members || []);

    const loadGroupMembers = async () => {
      try {
        const loadedMembers = await friendStore.getGroupMembers(group.id);
        if (Array.isArray(loadedMembers)) {
          setMembers(loadedMembers);
        }
      } catch (error) {
        console.error('Failed to load group members', error);
      }
    };

    loadGroupMembers();
  }, [isOpen, group]);

  const handleAddMember = async () => {
    if (!newMemberUsername.trim()) return;

    try {
      const userToAdd = await agent.Users.getUserByUserName(newMemberUsername.trim());
      if (!userToAdd) {
        alert('User not found.');
        return;
      }

      const isAlreadyMember = members.some(
        (member) => member.username === userToAdd.username
      );

      if (isAlreadyMember) {
        alert('User is already in the group.');
        return;
      }
      await friendStore.addFriendToGroup(group.id, userToAdd.id);
      setMembers([...members, userToAdd]);
      setNewMemberUsername('');
    } catch (error) {
      console.error('Error fetching user:', error);
      alert('User not found or server error.');
    }
  };

  const handleRemoveMember = async (member: User) => {
    try {
      const response = await friendStore.leaveFromGroup(group.id, member.id)
      console.log(response);
    }
    catch (error) {
        console.log(error);
    }
    finally {
      setMembers(members.filter((m) => m.username !== member.username));
    }
  };

  const handleSave = async () => {
    try {
      await agent.Friends.UpdateGroup(group.id, groupName);

      onSave({ ...group, name: groupName, members });
      onClose();
    } catch (error) {
      console.error('Failed to save group:', error);
      alert('Failed to save changes.');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage Group</DialogTitle>
      <DialogContent>
        <TextField
          label="Group Name"
          variant="outlined"
          fullWidth
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          margin="normal"
        />

        <TextField
          label="Add New Member (username)"
          variant="outlined"
          fullWidth
          value={newMemberUsername}
          onChange={(e) => setNewMemberUsername(e.target.value)}
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddMember}
          fullWidth
          style={{ marginBottom: '16px' }}
        >
          Add Member
        </Button>

        <List>
          {members.map((member, index) => (
            <ListItem
              key={member.id || `${member.username}-${index}`}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleRemoveMember(member)}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText primary={member.username} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
