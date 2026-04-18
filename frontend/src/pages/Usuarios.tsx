import { useEffect, useState } from 'react'
import { useAuth } from '../useAuth'
import api from '../api'
import { readStoredProfile, type StoredUserProfile } from '../profile-storage'
import './Usuarios.css'

type UsuarioListado = {
  id: number
  nombre: string
  email: string
  rol: string
  activo: boolean
  creadoEn: string
}

export default function Usuarios() {
  const EMPTY_FILTERS = { id: '', nombre: '', email: '', activo: '' }
  const { rol } = useAuth()
  const isAdmin = rol === 'ADMIN'
  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [isClearingFilters, setIsClearingFilters] = useState(false)
  const [tableMotionKey, setTableMotionKey] = useState(0)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UsuarioListado | null>(null)
  const [selectedUserProfile, setSelectedUserProfile] = useState<StoredUserProfile | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isClosingCreateModal, setIsClosingCreateModal] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'OPERADOR'>('OPERADOR')
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [confirmingActiveToggleUser, setConfirmingActiveToggleUser] = useState<UsuarioListado | null>(null)
  const [confirmActiveState, setConfirmActiveState] = useState<boolean | null>(null)

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

      if (currentFilters.activo) params.set('activo', currentFilters.activo)
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
  }, [filters.id, filters.nombre, filters.email, filters.activo])

  function applyFilters() {
    setFilters(draftFilters)
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    setDraftFilters(EMPTY_FILTERS)
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

  function openCreateModal() {
    setCreateError('')
    setNewUserName('')
    setNewUserEmail('')
    setNewUserPassword('')
    setNewUserRole('OPERADOR')
    setIsClosingCreateModal(false)
    setShowCreateModal(true)
  }

  function closeCreateModal() {
    if (isClosingCreateModal) return
    setIsClosingCreateModal(true)
    setTimeout(() => {
      setShowCreateModal(false)
      setIsClosingCreateModal(false)
    }, 280)
  }

  async function handleCreateUser() {
    setCreateError('')
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      setCreateError('Todos los campos son obligatorios.')
      return
    }

    setCreateLoading(true)
    try {
      await api.post('/auth/register', {
        nombre: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword.trim(),
        rol: newUserRole,
      })
      setShowCreateModal(false)
      setNewUserName('')
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserRole('OPERADOR')
      loadUsers(filters)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setCreateError(msg ?? 'No se pudo crear el usuario.')
    } finally {
      setCreateLoading(false)
    }
  }

  function requestToggleActive(user: UsuarioListado) {
    setConfirmingActiveToggleUser(user)
    setConfirmActiveState(!user.activo)
  }

  function closeToggleActiveConfirm() {
    setConfirmingActiveToggleUser(null)
    setConfirmActiveState(null)
  }

  async function handleToggleActive() {
    if (!confirmingActiveToggleUser || confirmActiveState === null) return

    try {
      await api.patch(`/auth/users/${confirmingActiveToggleUser.id}/activo`, { activo: confirmActiveState })
      closeToggleActiveConfirm()
      loadUsers(filters)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'No se pudo actualizar el estado del usuario.')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.toolbar}>
        <h2 style={{ margin: 0 }}>Usuarios</h2>
        {isAdmin && (
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            Registrar usuario
          </button>
        )}
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
              value={draftFilters.id}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, '')
                setDraftFilters((f) => ({ ...f, id: onlyDigits }))
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
              value={draftFilters.nombre}
              onChange={(e) => setDraftFilters((f) => ({ ...f, nombre: e.target.value }))}
              className="filter-control"
            />
          </label>

          <label className="filter-item" htmlFor="user-filter-email">
            <span className="filter-label">CORREO</span>
            <input
              id="user-filter-email"
              type="text"
              placeholder="Correo"
              value={draftFilters.email}
              onChange={(e) => setDraftFilters((f) => ({ ...f, email: e.target.value }))}
              className="filter-control"
            />
          </label>

          <label className="filter-item" htmlFor="user-filter-activo">
            <span className="filter-label">ESTADO</span>
            <select
              id="user-filter-activo"
              value={draftFilters.activo}
              onChange={(e) => setDraftFilters((f) => ({ ...f, activo: e.target.value }))}
              className="filter-control"
            >
              <option value="">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </label>
        </div>

        <div className="filters-divider" aria-hidden="true" />
        <div className="filters-actions">
          <button type="button" className="btn-primary" onClick={applyFilters}>Filtrar</button>
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
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha de creación</th>
                <th>Opciones</th>
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
                  <td>
                    <span className={`role-chip ${u.activo ? 'role-active' : 'role-inactive'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
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
                        <button
                          className="btn-outline usuarios-toggle-active-btn action-btn"
                          onClick={() => requestToggleActive(u)}
                          style={{ padding: '5px 12px', fontSize: '0.82rem' }}
                        >
                          {u.activo ? 'Inactivar' : 'Reactivar'}
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

      {showCreateModal && (
        <div className={`edit-modal-overlay ${isClosingCreateModal ? 'is-closing' : ''}`} onClick={closeCreateModal}>
          <div className={`edit-modal-card ${isClosingCreateModal ? 'is-closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            <h3 className="edit-modal-title">Registrar nuevo usuario</h3>
            <form className="edit-modal-form" onSubmit={(e) => { e.preventDefault(); handleCreateUser() }}>
              <label className="edit-modal-field" style={{ animationDelay: '40ms' }}>
                Nombre
                <input
                  className="modal-control"
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Nombre"
                />
              </label>
              <label className="edit-modal-field" style={{ animationDelay: '90ms' }}>
                Correo
                <input
                  className="modal-control"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Correo"
                />
              </label>
              <label className="edit-modal-field" style={{ animationDelay: '140ms' }}>
                Clave
                <input
                  className="modal-control"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Contraseña"
                />
              </label>
              <label className="edit-modal-field" style={{ animationDelay: '190ms' }}>
                Rol
                <span className="edit-modal-select-wrap">
                  <select
                    className="modal-control"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'ADMIN' | 'OPERADOR')}
                  >
                    <option value="OPERADOR">Operador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                  <span className="edit-modal-chevron" aria-hidden="true" />
                </span>
              </label>
              {createError && <div className="error-box" style={{ marginTop: '0' }}>{createError}</div>}
              <div className="edit-modal-actions">
                <button type="submit" className="btn-primary edit-modal-save" disabled={createLoading}>
                  {createLoading ? 'Creando...' : 'Crear usuario'}
                </button>
                <button type="button" className="btn-ghost edit-modal-cancel" onClick={closeCreateModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {confirmingActiveToggleUser && confirmActiveState !== null && (
        <div style={styles.overlay} onClick={closeToggleActiveConfirm}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Confirmar acción</h3>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '.95rem' }}>
              {confirmActiveState
                ? `¿Deseas reactivar al usuario ${confirmingActiveToggleUser.nombre}?`
                : `¿Deseas marcar como inactivo al usuario ${confirmingActiveToggleUser.nombre}?`}
            </p>
            <div style={styles.modalActions}>
              <button className="btn-primary" onClick={handleToggleActive}>
                {confirmActiveState ? 'Reactivar' : 'Inactivar'}
              </button>
              <button className="btn-ghost" onClick={closeToggleActiveConfirm}>
                Cancelar
              </button>
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
