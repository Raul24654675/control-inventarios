import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Layout() {
  const { email, rol, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <span style={styles.brand}>Inventario Industrial</span>
        <nav style={styles.nav}>
          <NavLink
            to="/equipos"
            style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}
          >
            Equipos
          </NavLink>
          <NavLink
            to="/historial"
            style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}
          >
            Historial
          </NavLink>
          {rol === 'ADMIN' && (
            <NavLink
              to="/usuarios"
              style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}
            >
              Usuarios
            </NavLink>
          )}
        </nav>
        <div style={styles.user}>
          <span style={styles.chip}>{rol}</span>
          <span style={styles.email}>{email}</span>
          <button className="btn-ghost" onClick={handleLogout} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  shell: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '0 28px',
    height: '58px',
    background: '#fff',
    boxShadow: '0 1px 0 var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: { fontWeight: 800, fontSize: '1rem', whiteSpace: 'nowrap' },
  nav: { display: 'flex', gap: '4px', flex: 1 },
  link: {
    padding: '6px 14px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'var(--muted)',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  linkActive: { background: 'var(--surface-alt)', color: 'var(--ink)' },
  user: { display: 'flex', alignItems: 'center', gap: '10px' },
  chip: {
    padding: '3px 10px',
    borderRadius: '999px',
    background: '#e0f4f0',
    color: 'var(--accent)',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  email: { color: 'var(--muted)', fontSize: '0.85rem' },
}
