import { Typography, Box, Avatar, IconButton } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../app/stores/store";

import GroupsIcon from '@mui/icons-material/Groups';
import { useEffect, useState } from "react";
import { User } from "../../../app/Models/user";

interface Props {
    isOpen: boolean;
    setIsOpen: Function;
    groupId: string;
}

export default observer(function GroupMembers({ isOpen, setIsOpen, groupId }: Props) {
    const { friendStore } = useStore();
    const [members, setMembers] = useState<User[]>([]);

    useEffect(() => {
        const fetchGroupMembers = async () => {
            if (!isOpen) return;
    
            try {
                setMembers([]);
                const response = await friendStore.getGroupMembers(groupId);
                if (Array.isArray(response)) {
                    setMembers(response);
                }
            } catch (error) {
                console.error('Error fetching group members:', error);
                setMembers([]);
            }
        };
    
        fetchGroupMembers();
    }, [isOpen, friendStore, groupId]);
    

    return (
        <>
            <Box display="flex" flexDirection="column" padding="5px" flexWrap="wrap" gap="10px">
                {isOpen ? (
                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                        <Box>
                            <IconButton onClick={() => setIsOpen(!isOpen)}>
                                <GroupsIcon />
                            </IconButton>
                        </Box>
                        <Typography variant="h6" sx={{ mb: 2, color: "white" }}>
                            Members
                        </Typography>
                    </Box>
                ) : (
                    <Box>
                        <IconButton onClick={() => setIsOpen(!isOpen)}>
                            <GroupsIcon />
                        </IconButton>
                    </Box>
                )}

        {isOpen && (
            <>
                {members.length === 0 ? (
                    <Typography>No members available</Typography>
                ) : (
                    members.map((member) => (
                        <Box
                            key={member.id}
                            display="flex"
                            sx={{
                                mb: "10px",
                                p: "5px",
                                borderRadius: 2,
                                '&:hover': {
                                    backgroundColor: "#4A4A4A",
                                },
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 32,
                                    height: 32,
                                    mr: 2,
                                }}
                                src={member.image || "/public/user.png"}
                            />
                            <Typography>{member.username || 'Unnamed'}</Typography>
                        </Box>
                    ))
                )}
            </>
        )}
            </Box>
        </>
    );
});
