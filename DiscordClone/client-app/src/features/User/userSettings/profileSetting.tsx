import { useEffect, useState, useRef } from "react";
import { Box, TextField, Button, Avatar, Typography, Divider } from "@mui/material";
import { useStore } from "../../../app/stores/store";
import { runInAction } from "mobx";

export default function ProfileSetting() {
    const { userStore } = useStore();
    const { user, updateUserField } = userStore;

    const [editingUsername, setEditingUsername] = useState<string>("");
    const [editingEmail, setEditingEmail] = useState<string>("");
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [newImagePreview, setNewImagePreview] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingField, setEditingField] = useState<null | 'username' | 'email'>(null);

    useEffect(() => {
        if (editingField === 'username' && user) {
            setEditingUsername(user.username || "");
        }
        if (editingField === 'email' && user) {
            setEditingEmail(user.email || "");
        }
    }, [editingField, user]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (newImagePreview) URL.revokeObjectURL(newImagePreview);
        if (file) {
            setNewImageFile(file);
            setNewImagePreview(URL.createObjectURL(file));
        } else {
            setNewImageFile(null);
            setNewImagePreview(null);
        }
    };

    const handlePhotoSubmit = async () => {
        if (!newImageFile) { alert("Please select a new photo to upload."); return; }
        const photoData = new FormData();
        photoData.append("file", newImageFile);
        try {
            await userStore.updateUserAvatar(photoData);
            setNewImageFile(null);
            setNewImagePreview(null);
        } catch (error) { console.error("Error while uploading photo:", error); }
    };

    const handleSubmitUsername = async () => {
        if (user && editingUsername !== user.username) {
            try {
                await updateUserField({ username: editingUsername });
            } catch (error) {
                console.error("Failed to update username", error);
                setEditingUsername(user.username || "");
            }
        }
        setEditingField(null);
    };

    const handleSubmitEmail = async () => {
        if (user && editingEmail !== user.email) {
            try {
                await updateUserField({ email: editingEmail });
            } catch (error) {
                console.error("Failed to update email", error);
                setEditingEmail(user.email || "");
            }
        }
        setEditingField(null);
    };

    const triggerFileInput = () => fileInputRef.current?.click();
    const getAvatarLetter = (name?: string) => (name?.[0] || '?').toUpperCase();

    const sectionContainerSx = { bgcolor: '#202225', borderRadius: '8px', p: '16px', mb: '20px', overflow: 'hidden' };
    const fieldLabelTypographySx = { color: '#8e9297', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', mb: '8px', display: 'block' };
    const fieldValueCurrentSx = { color: '#dcddde', fontSize: '14px', fontWeight: 400, minHeight: '38px', display: 'flex', alignItems: 'center', p: '0 10px', bgcolor: '#292b2f', borderRadius: '3px', flexGrow: 1 };
    const discordTextFieldInputPropsSx = { disableUnderline: true, sx: { backgroundColor: '#1e1f22', color: '#dcddde', borderRadius: '3px', fontSize: '14px', height: '38px', '& .MuiInputBase-input': { padding: '0 10px', height: '100%', boxSizing: 'border-box' as 'border-box', }, border: '1px solid #1a1b1e', boxShadow: 'none', '&:hover': { borderColor: '#000000', backgroundColor: '#1e1f22' }, '&.Mui-focused': { borderColor: '#5865f2', backgroundColor: '#1e1f22', boxShadow: 'none' }, '&.Mui-disabled': { backgroundColor: '#292b2f', color: '#72767d', opacity: 0.7 }, '&:before, &:after': { borderBottom: 'none !important' }, } };
    const discordEditButtonSx = { minWidth: '74px', height: '32px', bgcolor: '#4f545c', color: '#f2f3f5', fontSize: '14px', fontWeight: 500, padding: '0 16px', textTransform: 'none', borderRadius: '3px', boxShadow: 'none', border: 'none', '&:hover': { bgcolor: '#676b71', boxShadow: 'none' }, '&.Mui-disabled': { bgcolor: '#3e4046', color: '#7d8187', boxShadow: 'none' } };
    const discordPrimaryButtonSx = { ...discordEditButtonSx, bgcolor: '#5865f2', minWidth: '140px', height: '38px', padding: '0 16px', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#4752c4' }, };
    const discordDangerOutlinedButtonSx = { ...discordEditButtonSx, minWidth: '96px', height: '32px', padding: '0 16px', color: '#f23f42', bgcolor: 'transparent', border: '1px solid #f23f42', '&:hover': { bgcolor: 'rgba(242,63,66,0.1)', borderColor: '#f23f42' }, };
    const discordDangerContainedButtonSx = { ...discordEditButtonSx, minWidth: '120px', height: '32px', padding: '0 16px', bgcolor: '#d83c3e', color: 'white', '&:hover': { bgcolor: '#b02628' }, whiteSpace: 'nowrap', };


    return (
        <Box sx={{ width: '100%', color: '#dcddde', maxWidth: '740px', margin: '0 auto', pb: '40px' }}>
            <Typography variant="h1" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '20px', lineHeight: '24px', mb: '20px', pt: '20px' }}>My Account</Typography>
            <Box sx={{ bgcolor: '#18191e', height: '100px', borderRadius: '8px 8px 0 0', position: 'relative', mb: '68px' }}>
                <Box onClick={triggerFileInput} sx={{ position: 'absolute', left: '16px', bottom: '-56px', width: '92px', height: '92px', borderRadius: '50%', bgcolor: '#2f3136', padding: '6px', boxSizing: 'border-box', cursor: 'pointer' }}>
                    <Avatar src={newImagePreview || user?.image || "/default-avatar.png"} alt="user avatar" sx={{ width: '100%', height: '100%', fontSize: '2.5rem' }} >
                        {!newImagePreview && !user?.image && getAvatarLetter(user?.username)}
                    </Avatar>
                </Box>
                <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
                {newImageFile && (<Button variant="contained" onClick={handlePhotoSubmit} sx={{ ...discordEditButtonSx, position: 'absolute', bottom: '8px', right: '16px', bgcolor: '#3ba55c', '&:hover': { bgcolor: '#2d7d46' } }}>Save</Button>)}
            </Box>
            <Box sx={{ ...sectionContainerSx, p: '16px' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '20px', color: '#f2f3f5' }}>{user?.username || "Username"}</Typography>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: '20px' }} />
                <Box mb={2.5}>
                    <Typography sx={fieldLabelTypographySx}>Display Name</Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        {editingField === 'username' ? (
                            <TextField fullWidth name="username" variant="filled" value={editingUsername} onChange={(e) => setEditingUsername(e.target.value)} InputProps={discordTextFieldInputPropsSx} autoFocus onBlur={handleSubmitUsername} />
                        ) : (
                            <Typography sx={fieldValueCurrentSx}>{user?.username || ""}</Typography>
                        )}
                        <Button variant="contained" onClick={() => editingField === 'username' ? handleSubmitUsername() : setEditingField('username')} sx={{ ...discordEditButtonSx, ml: 2 }}>{editingField === 'username' ? 'Save' : 'Edit'}</Button>
                    </Box>
                </Box>
                <Box>
                    <Typography sx={fieldLabelTypographySx}>Email</Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        {editingField === 'email' ? (
                            <TextField fullWidth name="email" type="email" variant="filled" value={editingEmail} onChange={(e) => setEditingEmail(e.target.value)} InputProps={discordTextFieldInputPropsSx} autoFocus onBlur={handleSubmitEmail} />
                        ) : (
                            <Typography sx={fieldValueCurrentSx}>{user?.email || ""}</Typography>
                        )}
                        <Button variant="contained" onClick={() => editingField === 'email' ? handleSubmitEmail() : setEditingField('email')} sx={{ ...discordEditButtonSx, ml: 2 }}>{editingField === 'email' ? 'Save' : 'Edit'}</Button>
                    </Box>
                </Box>
            </Box>
            <Typography variant="h1" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '16px', lineHeight: '20px', mb: '16px', mt: '30px', borderTop: '1px solid rgba(255,255,255,0.06)', pt: '24px' }}>Password and Authentication</Typography>
            <Box sx={{ ...sectionContainerSx, p: '16px' }}><Button variant="contained" sx={discordPrimaryButtonSx}>Change Password</Button></Box>
            <Typography variant="h1" sx={{ color: '#ffffff', fontWeight: 600, fontSize: '16px', lineHeight: '20px', mb: '16px', mt: '30px', borderTop: '1px solid rgba(255,255,255,0.06)', pt: '24px' }}>Account Removal</Typography>
            <Box sx={{ ...sectionContainerSx, bgcolor: 'transparent', p: '16px !important', border: '1px solid #aa3738', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '10px' }}><Box><Typography sx={{ color: '#f2f3f5', fontWeight: 500, fontSize: '14px' }}>Disable Account</Typography><Typography variant="caption" sx={{ color: '#b9bbbe', display: 'block', fontSize: '12px' }}>Disabling your account means you can recover it any time.</Typography></Box><Button variant="outlined" sx={discordDangerOutlinedButtonSx}>Disable Account</Button></Box>
            <Box sx={{ ...sectionContainerSx, bgcolor: 'transparent', p: '16px !important', border: '1px solid #aa3738', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Box><Typography sx={{ color: '#f2f3f5', fontWeight: 500, fontSize: '14px' }}>Delete Account</Typography><Typography variant="caption" sx={{ color: '#b9bbbe', display: 'block', fontSize: '12px' }}>Permanently delete your account. This action cannot be undone.</Typography></Box><Button variant="contained" sx={discordDangerContainedButtonSx}>Delete Account</Button></Box>
        </Box>
    );
}