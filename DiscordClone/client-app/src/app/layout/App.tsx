import { useEffect, useRef } from 'react';
import { useStore } from '../stores/store';
import HomePage from './homePage';
import NavBar from './navBar';
import './styles.css';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminPanel from '../../features/Admin/AdminPanel';
import { ThemeProvider } from '@emotion/react';
import theme from '../theme/theme';
import { Box, Button } from '@mui/material';
import SideBar from './sideBar';
import IncomingCallModal from '../../features/User/calls/private/incomingCallModal';
import { observer } from "mobx-react-lite";
export default observer (function App() {

    const location = useLocation();
    const { userStore, signalRStore } = useStore();
    const navigate = useNavigate();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    useEffect(() => {
        if (audioRef.current) {
            signalRStore.setAudioElement(audioRef.current);
            console.log(audioRef);
        }
    }, [audioRef.current,signalRStore]);
    useEffect(() => {
        if (location.pathname === '/main' && !userStore.getLoggedIn()) {
            navigate('/login');
        }
    }, [location.pathname, userStore, navigate]);

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
                                    <Box>
                                        <NavBar />
                                    </Box>
                                    <Box>
                                        <SideBar />
                                            </Box>
                                     <Box pl="62px" mt="62px">
                                        <Outlet />
                                    </Box>
                                </>
                            )}
                        </>
                    ) : (
                        <Outlet />
                    )}
                </>
                )}
                {signalRStore.currentCall && <IncomingCallModal />}

                <audio  ref={audioRef} autoPlay controls style={{ margin: "100px" }} />
            </>
        </ThemeProvider>
    );
})
