import { useEffect, useRef } from 'react';
import { useStore } from '../stores/store';
import HomePage from './homePage';
import NavBar from './navBar';
import './styles.css';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminPanel from '../../features/Admin/AdminPanel';
import { ThemeProvider } from '@emotion/react';
import theme from '../theme/theme';
import { Box } from '@mui/material';
import SideBar from './sideBar';
import IncomingCallModal from '../../features/User/calls/private/incomingCallModal';
import { observer } from "mobx-react-lite";

export default observer(function App() {
    const location = useLocation();
    const { userStore, chatSignalRStore, voiceSignalRStore } = useStore();
    const navigate = useNavigate(); 

    const globalRemoteAudioContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (globalRemoteAudioContainerRef.current) {
            voiceSignalRStore.setRemoteAudioContainer(globalRemoteAudioContainerRef.current);
        }
    }, [voiceSignalRStore]);

    return (
        <ThemeProvider theme={theme}>
            <>
                {location.pathname === '/' ? <HomePage /> : (
                    <>
                        {location.pathname !== '/login' ? (
                            <>
                                {userStore.user?.role === 'Admin' ? (
                                    <AdminPanel />
                                ) : (
                                    <>
                                        <Box> {/* Container for NavBar */}
                                            <NavBar />
                                        </Box>
                                        <Box> {/* Container for SideBar */}
                                            <SideBar />
                                        </Box>
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: '48px',
                                                left: '72px',      
                                                height: 'calc(100vh - 48px)', 
                                                width: 'calc(100vw - 72px)',
                                                display: 'flex',
                                            }}
                                        >
                                            <Outlet /> {/* Renders ChannelDashboard */}
                                        </Box>
                                    </>
                                )}
                            </>
                        ) : (
                            <Outlet />
                        )}
                    </>
                )}

                {/* Global hidden container for ALL remote audio elements */}
                <div ref={globalRemoteAudioContainerRef} style={{ display: 'none' }} id="global-audio-container"></div>

                {/* Incoming Call Modal */}
                {voiceSignalRStore.isRinging &&
                    voiceSignalRStore.currentCallInfo &&
                    !voiceSignalRStore.currentCallInfo.isInitiator &&
                    <IncomingCallModal />}
            </>
        </ThemeProvider>
    );
})