import { Typography, Box, Avatar, IconButton, Tooltip } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useStore } from "../../../app/stores/store";
import { useEffect, useState } from "react";
import { User } from "../../../app/Models/user";

interface Props {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    groupId: string;
}

export default observer(function GroupMembers({ isOpen, setIsOpen, groupId }: Props) {
    const { friendStore } = useStore();
    const [members, setMembers] = useState<User[]>([]);

    useEffect(() => {
        const fetchGroupMembers = async () => {
            if (!isOpen || !groupId) {
                if (!isOpen) setMembers([]);
                return;
            }
            try {
                const response = await friendStore.getGroupMembers(groupId);
                if (Array.isArray(response)) {
                    setMembers(response);
                } else {
                    setMembers([]);
                }
            } catch (error) {
                console.error('Error fetching group members:', error);
                setMembers([]);
            }
        };
        fetchGroupMembers();
    }, [isOpen, groupId, friendStore]);


    const getAvatarLetter = (name?: string) => (name?.[0] || 'U').toUpperCase();
    const getAvatarColor = (id?: string) => {
        if (!id) return '#7289da';
        let hash = 0;
        for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return "#" + "00000".substring(0, 6 - c.length) + c;
    };


    return (
        <Box
            display="flex"
            flexDirection="column"
            height="100%"
            sx={{
                backgroundColor: "#2f3136",
                color: '#dcddde',
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    p: "12px 16px",
                    height: '49px',
                    borderBottom: '1px solid rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    boxSizing: 'border-box'
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: '600', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Members ({members.length})
                </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: "10px 10px" }}>
                {members.length === 0 ? (
                    <Typography sx={{ color: "#8e9297", textAlign: 'center', mt: 2, fontSize: '0.875rem' }}>
                        No members to display.
                    </Typography>
                ) : (
                    members.map((member) => (
                        <Box
                            key={member.id}
                            display="flex"
                            alignItems="center"
                            sx={{
                                mb: "2px",
                                p: "8px",
                                borderRadius: "4px",
                                '&:hover': {
                                    backgroundColor: "#3c3f46"
                                },
                                cursor: 'pointer'
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 32,
                                    height: 32,
                                    mr: 1.5,
                                    fontSize: '0.8rem',
                                    bgcolor: getAvatarColor(member.id)
                                }}
                                src={member.image || undefined}
                            >
                                {!member.image && getAvatarLetter(member.username)}
                            </Avatar>
                            <Typography variant="body2" sx={{ color: '#dcddde', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                                {member.username || 'Unnamed'}
                            </Typography>
                        </Box>
                    ))
                )}
            </Box>
        </Box>
    );
});