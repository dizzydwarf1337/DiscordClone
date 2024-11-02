
import { Box } from '@mui/material';
import HomePage from './homePage';
import NavBar from './navBar';
import SideBar from './sideBar'
import './styles.css'
import { Outlet, useLocation } from 'react-router-dom'

function App() {

    const location = useLocation();

return (
    <>
        {location.pathname === '/' ? <HomePage /> : (
            <>
                {location.pathname !== '/login' ? (
                    <>
                        <NavBar />
                        <SideBar />
                    </>
                ) : (
                    <Outlet />
                )}
            </>
        )}
    </>
  )
}

export default App
