import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/store';
import agent from '../API/agent';
import { Box, Button, Typography } from '@mui/material';

export const CreateServerModal = observer(() => {
    const { userStore, signalRStore } = useStore();
    const [serverName, setServerName] = useState('');
    const [description, setDescription] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleCreateServer = async () => {
        try {
            const response = await agent.Servers.createServer({
                name: serverName,
                description: description,
                ownerId: userStore.user?.id,
                isPublic: true
            });


            if (response.success) {
                await agent.Channels.createChannel({
                    name: 'general',
                    serverId: response.data.serverId,
                    channelType: 'text'
                });

                await signalRStore.joinChannel(response.data.serverId, 'general');

                setServerName('');
                setDescription('');
                setIsOpen(false);
            } else {
                console.error(response.message);
            }
        } catch (error) {
            console.error('Error creating server:', error);
        }
    };

    return (
        <Box>
            <Button
                onClick={() => setIsOpen(true)}
            >
                Create Server
            </Button>

            {isOpen && (
                <Box
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setIsOpen(false)}
                >
                    <Box display="flex" flexDirection="column" justifyContent="center"
                      sx={{
                            backgroundColor: 'secondary.main',
                            padding: '20px',
                            borderRadius: '8px',
                            width: '700px',
                            maxWidth: '90%'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Typography variant="h2"  >Create New Server</Typography>
                        <Typography variant="h5" >
                            Set up a new server for your community
                        </Typography>

                        <Box sx={{mb:"8px"} }>
                            <label
                                htmlFor="serverName"
                                style={{ display: 'block', marginBottom: '8px' }}
                            >
                                Server Name
                            </label>
                            <input
                                id="serverName"
                                type="text"
                                value={serverName}
                                onChange={(e) => setServerName(e.target.value)}
                                placeholder="Enter server name"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                }}
                            />
                        </Box>

                        <Box style={{ marginBottom: '16px' }}>
                            <label
                                htmlFor="description"
                                style={{ display: 'block', marginBottom: '8px' }}
                            >
                                Description
                            </label>
                            <input
                                id="description"
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional server description"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                }}
                            />
                        </Box>

                        <Box style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="outlined" color="success"
                                onClick={handleCreateServer}
                                disabled={!serverName || userStore.loading}
                                style={{
                                    padding: '8px 16px',
                                    cursor: !serverName || userStore.loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {userStore.loading ? 'Creating...' : 'Create Server'}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
});