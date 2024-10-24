import HomePage from './HomePage'
import NavBar from './NavBar'
import SideBar from './sideBar'
import './styles.css'
import { Outlet } from 'react-router-dom'

function App() {


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
