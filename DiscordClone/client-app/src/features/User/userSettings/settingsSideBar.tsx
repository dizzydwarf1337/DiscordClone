import { useState } from "react";
import { Box, Typography, Button, Divider, List, ListItemButton, ListItemText, ListItemIcon } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined';

interface SettingsItem {
    key: string;
    label: string;
    icon?: React.ReactElement;
    path: string;
    section?: string;
    isDestructive?: boolean;
}

const settingsItems: SettingsItem[] = [
    { key: 'my-account', label: "My Account", path: "", section: "User Settings", icon: <AccountCircleOutlinedIcon sx={{ fontSize: 20 }} /> },
    { key: 'user-profile', label: "User Profile", path: "user-profile", section: "User Settings", icon: <AccountCircleOutlinedIcon sx={{ fontSize: 20 }} /> },
    { key: 'privacy', label: "Privacy & Safety", path: "privacy", section: "User Settings", icon: <SecurityOutlinedIcon sx={{ fontSize: 20 }} /> },

    { key: 'appearance', label: "Appearance", path: "appearance", section: "App Settings", icon: <TuneOutlinedIcon sx={{ fontSize: 20 }} /> },
    { key: 'accessibility', label: "Accessibility", path: "accessibility", section: "App Settings", icon: <TuneOutlinedIcon sx={{ fontSize: 20 }} /> },
    { key: 'voice-video', label: "Voice & Video", path: "voice-video", section: "App Settings", icon: <TuneOutlinedIcon sx={{ fontSize: 20 }} /> },

    { key: 'billing', label: "Billing", path: "billing", section: "Billing Settings", icon: <CreditCardOutlinedIcon sx={{ fontSize: 20 }} /> },
    { key: 'nitro', label: "Nitro", path: "nitro", section: "Billing Settings", icon: <RedeemOutlinedIcon sx={{ fontSize: 20 }} /> },
];

const bottomItems: SettingsItem[] = [
    { key: 'logout', label: "Log Out", path: "#logout", icon: <ExitToAppIcon sx={{ fontSize: 20 }} />, isDestructive: true },
    // { key: 'delete-account', label: "Delete Account", path: "delete-account", isDestructive: true }, // Your original
];


export default function SettingsSideBar() {
    const navigate = useNavigate();
    const location = useLocation();

    const currentPathSuffix = location.pathname.replace('/profile', '').replace(/^\//, '');
    const [selectedKey, setSelectedKey] = useState<string>(currentPathSuffix || "");

    const handleNavigation = (item: SettingsItem) => {
        if (item.path === "#logout") {
            // Handle logout logic (e.g., call userStore.LogOut() then navigate)
            // For now, just navigating to illustrate
            // userStore.LogOut().then(() => navigate('/'));
            console.log("Logout action");
            navigate('/');
        } else {
            setSelectedKey(item.path);
            navigate(item.path === "" ? "/profile" : `/profile/${item.path}`);
        }
    };

    // Group items by section for rendering
    const groupedSettings = settingsItems.reduce((acc, item) => {
        const section = item.section || "Other Settings";
        if (!acc[section]) acc[section] = [];
        acc[section].push(item);
        return acc;
    }, {} as Record<string, SettingsItem[]>);


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: "100%", width: "100%" }}>
            <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0, scrollbarWidth: 'thin', '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#202225', borderRadius: '3px' } }}>
                {Object.entries(groupedSettings).map(([sectionName, items]) => (
                    <Box key={sectionName} sx={{ mb: '16px' }}>
                        <Typography
                            variant="overline"
                            sx={{
                                display: 'block',
                                color: "#8e9297",
                                fontWeight: 700,
                                fontSize: '0.6875rem',
                                lineHeight: '16px',
                                padding: '12px 10px 4px 10px',
                                textTransform: 'uppercase'
                            }}
                        >
                            {sectionName}
                        </Typography>
                        {items.map((item) => (
                            <ListItemButton
                                key={item.key}
                                selected={selectedKey === item.path}
                                onClick={() => handleNavigation(item)}
                                sx={{
                                    pl: '10px',
                                    pr: '8px',
                                    py: '8px',
                                    borderRadius: '4px',
                                    mb: '2px',
                                    color: item.isDestructive ? '#f23f42' : (selectedKey === item.path ? '#ffffff' : '#8e9297'),
                                    backgroundColor: selectedKey === item.path ? '#393c43' : 'transparent',
                                    '&:hover': {
                                        backgroundColor: item.isDestructive ? 'rgba(242,63,66,0.1)' : '#35373d',
                                        color: item.isDestructive ? '#f23f42' : '#dcddde',
                                    },
                                    '&.Mui-selected': {
                                        backgroundColor: '#40444b',
                                        color: '#ffffff',
                                        '&:hover': {
                                            backgroundColor: '#4a4d53',
                                        }
                                    },
                                    position: 'relative',
                                    '&.Mui-selected::before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: '-4px',
                                        top: 'calc(50% - 10px)',
                                        height: '20px',
                                        width: '4px',
                                        backgroundColor: 'white',
                                        borderRadius: '0 4px 4px 0',
                                    }
                                }}
                            >
                                {item.icon && <ListItemIcon sx={{ minWidth: '32px', color: 'inherit' }}>{item.icon}</ListItemIcon>}
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{ sx: { fontSize: '0.9375rem', fontWeight: 500, color: 'inherit' } }}
                                />
                            </ListItemButton>
                        ))}
                        {sectionName !== Object.keys(groupedSettings)[Object.keys(groupedSettings).length - 1] && (
                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: '12px', mx: '10px' }} />
                        )}
                    </Box>
                ))}
            </List>

            <Box sx={{ flexShrink: 0, pt: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', mx: '10px' }}>
                {bottomItems.map((item) => (
                    <ListItemButton
                        key={item.key}
                        onClick={() => handleNavigation(item)}
                        sx={{
                            pl: '10px', pr: '8px', py: '8px', borderRadius: '4px', mb: '2px',
                            color: item.isDestructive ? '#f23f42' : '#8e9297',
                            '&:hover': {
                                backgroundColor: item.isDestructive ? 'rgba(242,63,66,0.1)' : '#35373d',
                                color: item.isDestructive ? '#f23f42' : '#dcddde',
                            },
                        }}
                    >
                        {item.icon && <ListItemIcon sx={{ minWidth: '32px', color: 'inherit' }}>{item.icon}</ListItemIcon>}
                        <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ sx: { fontSize: '0.9375rem', fontWeight: 500, color: 'inherit' } }}
                        />
                    </ListItemButton>
                ))}
            </Box>
        </Box>
    );
}