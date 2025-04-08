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
import { UpdateGroupNameDto } from '../../../app/Models/UpdateGroupDto';

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
  onSave: () => void;
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
          // Exclude the current user from the list of members
          const filteredMembers = loadedMembers.filter(
            (member) => member.id !== userStore.user?.id
          );
          setMembers(filteredMembers);
        }
      } catch (error) {
        console.error('Failed to load group members', error);
      }
    };

    loadGroupMembers();
  }, [isOpen, group, userStore.user?.id]);

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
    // Do not allow removing the current user
    if (member.id === userStore.user?.id) {
      alert("You can't remove yourself from the group.");
      return;
    }

    try {
      const response = await friendStore.leaveFromGroup(group.id, member.id);
      console.log(response);
    } catch (error) {
      console.log(error);
    } finally {
      setMembers(members.filter((m) => m.username !== member.username));
    }
  };

  const handleChangeGroupName = async () => {
    try {
      if (!groupName.trim()) {
        alert('Group name cannot be empty.');
        return;
      }
      const updateGroupName: UpdateGroupNameDto = {
        GroupId: group.id,
        GroupName: groupName
      };
      await agent.Friends.UpdateGroupName(updateGroupName);

      onSave();
    } catch (error) {
      console.error('Failed to update group name:', error);
      alert('Failed to update group name. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      onSave();
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', marginTop: '8px' }}>
          <TextField
            label="Group Name"
            variant="outlined"
            fullWidth
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            margin="normal"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleChangeGroupName}
            size="small"
            style={{ marginTop: '8px' }}
          >
            Save
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
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
            size="small"
            style={{ marginTop: '8px' }}
          >
            Add
          </Button>
        </div>

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
        <Button onClick={handleSave} color="primary" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
