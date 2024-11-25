import React, { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import { useStore } from "../stores/store"; // Adjust the path as necessary

const ProfilePage: React.FC = () => {
    const { userStore } = useStore();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleAvatarUpdate = async () => {
        if (selectedFile) {
            setIsLoading(true);

            const formData = new FormData();
            formData.append('file', selectedFile);

            try {
                const response = await userStore.updateAvatar(formData);

                console.log("Avatar update response:", response);

                if (response.success) {
                    alert("Avatar updated successfully!");
                    // Zaktualizuj dane u¿ytkownika np. avatarUrl
                } else {
                    alert(response?.message || "Failed to update avatar.");
                }
            } catch (error) {
                console.error("Error during avatar update:", error);
                alert("Error updating avatar.");
            } finally {
                setIsLoading(false);
            }
        }
    };


    return (
        <div>
            <h2>Profile</h2>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
            />
            <Button
                variant="contained"
                color="primary"
                onClick={handleAvatarUpdate}
                disabled={isLoading}
            >
                {isLoading ? <CircularProgress size={24} /> : "Update Avatar"}
            </Button>
        </div>
    );
};

export default ProfilePage;