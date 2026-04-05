import { useEffect, useState } from 'react'
import api from '../api'
import { readStoredProfile, type StoredUserProfile } from '../profile-storage'
import './Usuarios.css'

type UsuarioListado = {
  id: number
  nombre: string
  email: string
  rol: string
  creadoEn: string
}

export default function Usuarios() {
  const EMPTY_FILTERS = { id: '', nombre: '', email: '' }
  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [isClearingFilters, setIsClearingFilters] = useState(false)
  const [tableMotionKey, setTableMotionKey] = useState(0)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UsuarioListado | null>(null)
  const [selectedUserProfile, setSelectedUserProfile] = useState<StoredUserProfile | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const profileInitials = (selectedUserProfile?.displayName || selectedUserProfile?.fullName || selectedUser?.nombre || 'OP')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'OP'

  async function loadUsers(currentFilters = filters) {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (currentFilters.id) params.set('id', currentFilters.id)
      if (currentFilters.nombre) params.set('nombre', currentFilters.nombre)
      if (currentFilters.email) params.set('email', currentFilters.email)

      const query = params.toString()
      const { data } = await api.get<UsuarioListado[]>(`/auth/users${query ? `?${query}` : ''}`)
      setUsuarios(data)
      setTableMotionKey((k) => k + 1)
    } catch {
      setError('No se pudo cargar la lista de usuarios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(filters)
  }, [filters.id, filters.nombre, filters.email])

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    setIsClearingFilters(true)
    setTimeout(() => setIsClearingFilters(false), 430)
  }

  function openPasswordModal(user: UsuarioListado) {
    setSelectedUser(user)
    setNewPassword('')
    setPasswordError('')
    setShowPasswordModal(true)
  }

  function openProfileModal(user: UsuarioListado) {
    setSelectedUser(user)
    setSelectedUserProfile(readStoredProfile(user.email, user.rol))
    setShowProfileModal(true)
  }

  async function handleUpdatePassword() {
    if (!selectedUser) return
    if (!newPassword.trim()) {
      setPasswordError('La nueva clave es obligatoria.')
      return
    }

    setPasswordLoading(true)
    setPasswordError('')
    try {
      await api.patch(`/auth/users/${selectedUser.id}/password`, { password: newPassword.trim() })
      setShowPasswordModal(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setPasswordError(msg ?? 'No se pudo actualizar la clave.')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleDeleteUser(user: UsuarioListado) {
    if (!confirm(`¿Eliminar al usuario ${user.nombre}? Esta acción no se puede deshacer.`)) return
    try {
      await api.delete(`/auth/users/${user.id}`)
      loadUsers(filters)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'No se pudo eliminar el usuario.')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.toolbar}>
        <h2 style={{ margin: 0 }}>Usuarios</h2>
      </div>

      <section className={`filters-card ${isClearingFilters ? 'is-clearing' : ''}`} aria-label="Filtros de usuarios">
        <h3 className="filters-title">FILTROS</h3>
        <div className="filters-divider" aria-hidden="true" />

        <div className="filters-grid filters-grid-users">
          <label className="filter-item" htmlFor="user-filter-id">
            <span className="filter-label">ID</span>
            <input
              id="user-filter-id"
              type="text"
              inputMode="numeric"
              placeholder="ID"
              value={filters.id}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, '')
                setFilters((f) => ({ ...f, id: onlyDigits }))
              }}
              className="filter-control"
            />
          </label>

          <label className="filter-item" htmlFor="user-filter-nombre">
            <span className="filter-label">NOMBRE</span>
            <input
              id="user-filter-nombre"
              type="text"
              placeholder="Nombre"
              value={filters.nombre}
              onChange={(e) => setFilters((f) => ({ ...f, nombre: e.target.value }))}
              className="filter-control"
            />
          </label>

          <label className="filter-item" htmlFor="user-filter-email">
            <span className="filter-label">CORREO</span>
            <input
              id="user-filter-email"
              type="text"
              placeholder="Correo"
              value={filters.email}
              onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))}
              className="filter-control"
            />
          </label>
        </div>

        <div className="filters-divider" aria-hidden="true" />
        <div className="filters-actions">
          <button type="button" className="btn-ghost" onClick={clearFilters}>Limpiar</button>
        </div>
      </section>

      {error && <div className="error-box">{error}</div>}

      <div style={styles.tableWrap} className={`usuarios-table-wrap ${loading && usuarios.length > 0 ? 'is-filtering' : ''}`}>
        {loading && usuarios.length === 0 ? (
          <p style={{ padding: '20px', color: 'var(--muted)' }}>Cargando...</p>
        ) : usuarios.length === 0 ? (
          <p style={{ padding: '20px', color: 'var(--muted)' }}>No hay usuarios registrados.</p>
        ) : (
          <table className="usuarios-table usuarios-table-animated" key={tableMotionKey}>
            <thead>
              <tr>
                <th>ID</th>
                <th>nombre</th>
                <th>email</th>
                <th>rol</th>
                <th>creadoEn</th>
                <th>acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, index) => (
                <tr key={u.id} className="usuarios-row" style={{ animationDelay: `${index * 90}ms` }}>
                  <td style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                  <td style={{ fontWeight: 600 }}>{u.email}</td>
                  <td>
                    <span className={`role-chip ${u.rol === 'ADMIN' ? 'role-admin' : 'role-operador'}`}>
                      {u.rol === 'ADMIN' ? 'Administrador' : 'Operador'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
                    {new Date(u.creadoEn).toLocaleString('es-ES')}
                  </td>
                  <td>
                    {u.rol === 'OPERADOR' ? (
                      <div className="row-actions">
                        <button className="btn-outline usuarios-view-btn action-btn" onClick={() => openProfileModal(u)} style={{ padding: '5px 12px', fontSize: '0.82rem' }}>
                          Ver perfil
                        </button>
                        <button className="btn-ghost usuarios-edit-btn action-btn" onClick={() => openPasswordModal(u)} style={{ padding: '5px 12px', fontSize: '0.82rem' }}>
                          Editar contraseña
                        </button>
                        <button className="btn-danger usuarios-delete-btn action-btn" onClick={() => handleDeleteUser(u)} style={{ padding: '5px 12px', fontSize: '0.82rem' }}>
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showPasswordModal && selectedUser && (
        <div style={styles.overlay} onClick={() => setShowPasswordModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Editar contraseña</h3>
            <p style={{ marginTop: 0, color: 'var(--muted)', fontSize: '.9rem' }}>
              Usuario: {selectedUser.nombre} ({selectedUser.email})
            </p>
            <label style={styles.label}>
              Nueva clave
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa la nueva clave"
              />
            </label>
            {passwordError && <div className="error-box">{passwordError}</div>}
            <div style={styles.modalActions}>
              <button className="btn-primary" onClick={handleUpdatePassword} disabled={passwordLoading}>
                {passwordLoading ? 'Guardando...' : 'Guardar'}
              </button>
              <button className="btn-ghost" onClick={() => setShowPasswordModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && selectedUser && selectedUserProfile && (
        <div className="user-profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="user-profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="user-profile-modal-head">
              <h3 style={{ margin: 0 }}>Perfil del operador</h3>
              <button type="button" className="btn-ghost" onClick={() => setShowProfileModal(false)}>
                Cerrar
              </button>
            </div>

            <p className="user-profile-modal-subtitle">
              Informacion registrada por <strong>{selectedUser.nombre}</strong> en la pestaña de perfil.
            </p>

            <div className="user-profile-modal-summary">
              <div className="user-profile-avatar-wrap">
                {selectedUserProfile.avatar ? (
                  <img src={selectedUserProfile.avatar} alt={selectedUserProfile.fullName || selectedUser.nombre} className="user-profile-avatar-image" />
                ) : (
                  <span className="user-profile-avatar-fallback">{profileInitials}</span>
                )}
              </div>

              <div>
                <strong className="user-profile-name">{selectedUserProfile.displayName || selectedUser.nombre}</strong>
                <p className="user-profile-fullname">{selectedUserProfile.fullName || 'Sin nombre completo'}</p>
                <span className="role-chip role-operador">{selectedUserProfile.roleLabel}</span>
              </div>
            </div>

            <div className="user-profile-modal-grid">
              <div className="user-profile-item">
                <span className="user-profile-label">Nombre de usuario</span>
                <strong>{selectedUserProfile.displayName || 'No definido'}</strong>
              </div>
              <div className="user-profile-item">
                <span className="user-profile-label">Nombre completo</span>
                <strong>{selectedUserProfile.fullName || 'No definido'}</strong>
              </div>
              <div className="user-profile-item">
                <span className="user-profile-label">Correo</span>
                <strong>{selectedUser.email}</strong>
              </div>
              <div className="user-profile-item">
                <span className="user-profile-label">Telefono</span>
                <strong>{selectedUserProfile.phone || 'No definido'}</strong>
              </div>
              <div className="user-profile-item">
                <span className="user-profile-label">Rol</span>
                <strong>{selectedUserProfile.roleLabel}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '28px', maxWidth: '1300px', margin: '0 auto' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' },
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '18px',
    background: 'var(--surface)',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
  },
  tableWrap: {
    background: 'var(--surface)',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(20,30,32,.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: '14px',
    padding: '20px',
    width: '100%',
    maxWidth: '460px',
    border: '1px solid var(--border)',
    boxShadow: '0 18px 40px rgba(20,30,32,.25)',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '.86rem',
    color: 'var(--muted)',
  },
  modalActions: {
    marginTop: '14px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
}
