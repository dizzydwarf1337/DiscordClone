import { useEffect } from 'react';
import { useStore } from '../stores/store';
import HomePage from './homePage';
import NavBar from './navBar';
import SideBar from './sideBar';
import './styles.css';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminPanel from '../../features/Admin/AdminPanel';

function App() {

    const location = useLocation();
    const { userStore } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.pathname === '/main' && !userStore.getLoggedIn()) {
            navigate('/login');
        }
    }, [location.pathname, userStore, navigate]);

    return (
        <>
            {location.pathname === '/' ? <HomePage /> : (
                <>
                    {location.pathname !== '/login' ? (
                        <>
                            {userStore.user?.role === 'Admin' ? (
                                <AdminPanel />
                            ) : (
                                <>
                                    <NavBar />
                                    <SideBar />
                                    <Outlet />
                                </>
                            )}
                        </>
                    ) : (
                        <Outlet />
                    )}
                </>
            )}
        </>
    );
}

export default App;
