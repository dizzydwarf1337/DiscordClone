import React from "react";
import { observer } from "mobx-react-lite";
import { Box, Typography, IconButton, Avatar, Tooltip } from "@mui/material";
import { useStore } from "../../../app/stores/store";
import GroupsIcon from '@mui/icons-material/Groups';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface ServerMembersProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export default observer(function ServerMembers({ isOpen, setIsOpen }: ServerMembersProps) {
    const { serverStore } = useStore();

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
            sx={{ overflow: 'hidden' }}
        >
            <Box
                sx={{
                    p: "12px 16px",
                    borderBottom: '1px solid rgba(0,0,0,0.2)',
                    display: 'flex',
                    justifyContent: isOpen ? 'space-between' : 'center',
                    alignItems: 'center',
                    minHeight: '49px'
                }}
            >
                {isOpen && (
                    <Typography variant="h6" sx={{ fontWeight: '600', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Members
                    </Typography>
                )}
                <Tooltip title={isOpen ? "Hide Member List" : "Show Member List"} placement="bottom">
                    <IconButton onClick={() => setIsOpen(!isOpen)} size="small" sx={{ color: '#b9bbbe', '&:hover': { color: 'white' } }}>
                        {isOpen ? <ChevronRightIcon /> : <GroupsIcon />}
                    </IconButton>
                </Tooltip>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: isOpen ? "10px 10px" : "10px 5px" }}>
                {serverStore.serverMembers.length === 0 && isOpen && (
                    <Typography sx={{ color: "#8e9297", textAlign: 'center', mt: 2 }}>
                        No members to display.
                    </Typography>
                )}
                {serverStore.serverMembers.map((member) => (
                    <Tooltip title={member.username || 'Unnamed User'} placement="left" key={member.id} disableHoverListener={isOpen}>
                        <Box
                            display="flex"
                            alignItems="center"
                            sx={{
                                p: isOpen ? "8px" : "6px 0px 6px 7px",
                                borderRadius: "4px",
                                mb: "2px",
                                cursor: "pointer",
                                '&:hover': {
                                    backgroundColor: "rgba(255,255,255,0.04)"
                                },
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: isOpen ? 32 : 36,
                                    height: isOpen ? 32 : 36,
                                    mr: isOpen ? 1.5 : 0,
                                    fontSize: '0.8rem',
                                    bgcolor: getAvatarColor(member.id)
                                }}
                                src={member.image || undefined}
                            >
                                {!member.image && getAvatarLetter(member.username)}
                            </Avatar>
                            {isOpen && (
                                <Typography variant="body2" sx={{ color: '#dcddde', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {member.username || 'Unnamed User'}
                                </Typography>
                            )}
                        </Box>
                    </Tooltip>
                ))}
            </Box>
        </Box>
    );
});