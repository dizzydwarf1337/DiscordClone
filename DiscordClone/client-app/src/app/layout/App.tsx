import HomePage from './HomePage'
import NavBar from './NavBar'
import SideBar from './sideBar'
import './styles.css'
import { Outlet, useLocation } from 'react-router-dom'

function App() {

    const location = useLocation();

return (
    <>
        {location.pathname === '/' ? <HomePage /> : (
            <>
                <NavBar />
                <SideBar />
                <Outlet />
            </>
        )}
    </>
  )
}

export default App
