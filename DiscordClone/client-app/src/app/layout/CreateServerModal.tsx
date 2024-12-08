import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/store';
import agent from '../API/agent';

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
        <div>
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    padding: '8px 16px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white'
                }}
            >
                Create Server
            </button>

            {isOpen && (
                <div
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
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            width: '400px',
                            maxWidth: '90%'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ marginBottom: '16px' }}>Create New Server</h2>
                        <p style={{ marginBottom: '16px', color: '#666' }}>
                            Set up a new server for your community
                        </p>

                        <div style={{ marginBottom: '16px' }}>
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
                        </div>

                        <div style={{ marginBottom: '16px' }}>
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
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleCreateServer}
                                disabled={!serverName || userStore.loading}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: !serverName || userStore.loading ? '#ccc' : '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: !serverName || userStore.loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {userStore.loading ? 'Creating...' : 'Create Server'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});