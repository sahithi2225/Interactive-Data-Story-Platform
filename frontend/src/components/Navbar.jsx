import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const nav = useNavigate()
  return (
    <header className="navbar">
      <NavLink to="/" className="brand">◆ IDSP</NavLink>
      <nav className="nav-links">
        {user && <>
          <NavLink to="/upload">Upload</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/insights">Insights</NavLink>
          <NavLink to="/story">Story</NavLink>
        </>}
        <button className="btn ghost" onClick={toggle} title="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        {user
          ? <button className="btn ghost" onClick={() => { logout(); nav('/') }}>Logout</button>
          : <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/signup"><button className="btn">Get started</button></NavLink>
            </>}
      </nav>
    </header>
  )
}
