import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../useAuth'
import { PROFILE_UPDATED_EVENT, readStoredProfile } from '../profile-storage'
import rajaskiLogoDark from '../assets/rajaski-logo-dark.svg'
import rajaskiLogoLight from '../assets/rajaski-logo-light.svg'
import './Layout.css'

export default function Layout() {
  const { email, rol, logout, theme, setTheme } = useAuth()
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [profileRevision, setProfileRevision] = useState(0)
  void profileRevision
  const storedProfile = readStoredProfile(email, rol)
  const isAdmin = rol === 'ADMIN'

  useEffect(() => {
    function handleProfileUpdated() {
      setProfileRevision(current => current + 1)
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated)
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated)
  }, [email, rol])

  const initials = useMemo(() => {
    const source = storedProfile.displayName || storedProfile.fullName || email || 'RK'
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'RK'
  }, [email, storedProfile.displayName, storedProfile.fullName])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function handleGoToProfile() {
    setOpenMenu(false)
    navigate('/perfil')
  }

  function handleGoToUsuarios() {
    setOpenMenu(false)
    navigate('/usuarios')
  }

  function closeOnOutside(event: MouseEvent<HTMLDivElement>) {
    if (menuRef.current && event.target instanceof Node && !menuRef.current.contains(event.target)) {
      setOpenMenu(false)
    }
  }

  return (
    <div className={`app-shell ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`} onClick={closeOnOutside}>
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand-block">
            <img src={theme === 'dark' ? rajaskiLogoDark : rajaskiLogoLight} alt="RAJASKI" className="brand-logo" />
            <div className="brand-text" aria-hidden="true">
              <strong>RAJASKI</strong>
              <span>Sistema de control de inventarios</span>
            </div>
          </div>

          <nav className="topbar-nav">
            <NavLink
              to="/equipos"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Equipos
            </NavLink>
            <NavLink
              to="/historial"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Historial
            </NavLink>
          </nav>
        </div>

        <div className="topbar-right" ref={menuRef}>
          <label className="layout-theme-switch" aria-label="Cambiar tema claro u oscuro">
            <input
              type="checkbox"
              checked={theme === 'light'}
              onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            />
            <span className="layout-theme-track" aria-hidden="true">
              <span className="layout-theme-icon layout-theme-icon-moon">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 1 0 21 12.8Z" />
                </svg>
              </span>
              <span className="layout-theme-icon layout-theme-icon-sun">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2.2M19.8 12H22M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
                </svg>
              </span>
              <span className="layout-theme-thumb" />
            </span>
          </label>

          <button
            type="button"
            className="user-trigger"
            onClick={() => setOpenMenu(v => !v)}
          >
            <span className="user-avatar">
              {storedProfile.avatar ? (
                <img src={storedProfile.avatar} alt={storedProfile.fullName} className="user-avatar-image" />
              ) : (
                initials
              )}
            </span>
            <span className="user-meta">
              <span className="user-email">{email ?? 'usuario@rajaski.local'}</span>
              <span className="user-role">{rol ?? 'OPERADOR'}</span>
            </span>
            <span className={`user-caret ${openMenu ? 'open' : ''}`}>▾</span>
          </button>

          {openMenu && (
            <div className="user-menu">
              <button type="button" className="menu-item" onClick={handleGoToProfile}>
                Perfil
              </button>
              {isAdmin && (
                <button type="button" className="menu-item" onClick={handleGoToUsuarios}>
                  Gestionar usuarios
                </button>
              )}
              <button type="button" className="menu-item danger" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
