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
                const success = await userStore.updateAvatar(selectedFile); // Call updateAvatar directly
                if (success) {
                    alert("Avatar updated successfully!");
                } else {
                    alert("Failed to update avatar.");
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
        <div className="profil-box-c">
            <div>
                <h2>Profile</h2>
                {/* Display the avatar */}
                <img
                    src={userStore.user?.avatarUrl || 'default-avatar.png'} // Display the avatar or a default one
                    alt="User Avatar"
                    style={{ width: '100px', height: '100px', borderRadius: '50%' }}
                />
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
        </div>
    );
};


export default ProfilePage;