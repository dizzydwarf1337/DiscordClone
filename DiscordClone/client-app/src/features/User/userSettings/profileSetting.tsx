import { useEffect, useState } from "react";
import { Box, TextField, Button, Avatar, Grid } from "@mui/material";
import { useStore } from "../../../app/stores/store";

export default function ProfileSetting() {
    const { userStore } = useStore();
    const { user, updateUserField } = userStore;

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        image: null,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username,
                email: user.email,
                image: user.image,
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, image: file }));
        }
    };

    const handlePhotoSubmit = async () => {
        if (formData.image == user.image) {
            alert("Please select a photo before uploading!");
            return;
        }

        const photoData = new FormData();
        photoData.append("file", formData.image);

        try {
            await userStore.updateUserAvatar(photoData);
            setFormData((prev) => ({ ...prev, image: userStore.user?.image }));
        } catch (error) {
            console.error("Error while uploading photo:", error);
        }
    };

    const handleSubmit = async () => {
        const { username, email } = formData;
        await updateUserField({ username, email });
    };

    return (
        <Box sx={{p:4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "55vh"}} >
            <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} sm={4}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                        <Avatar
                            src={user?.image || "/user.png"}
                            alt="user"
                            sx={{ width: 120, height: 120 }}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <Button
                            variant="outlined"
                            color="success"
                            onClick={handlePhotoSubmit}
                        >
                            Upload Photo
                        </Button>
                    </Box>
                </Grid>

                <Grid item xs={12} sm={8}>
                    <Box display="flex" flexDirection="column" gap={3}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <TextField
                                fullWidth
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                            />
                            <Button
                                variant="outlined"
                                color="success"
                                onClick={handleSubmit}
                                size="small"
                            >
                                Update Username
                            </Button>
                        </Box>

                        <Box display="flex" alignItems="center" gap={2}>
                            <TextField
                                fullWidth
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <Button
                                variant="outlined"
                                color="success"
                                onClick={handleSubmit}
                                size="small"
                            >
                                Update  Email
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
