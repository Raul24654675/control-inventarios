import { useEffect, useState } from 'react'
import api from '../api'

type UsuarioListado = {
  id: number
  nombre: string
  email: string
  rol: string
  creadoEn: string
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ id: '', nombre: '', email: '' })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UsuarioListado | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

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
    } catch {
      setError('No se pudo cargar la lista de usuarios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(filters)
  }, [filters.id, filters.nombre, filters.email])

  function openPasswordModal(user: UsuarioListado) {
    setSelectedUser(user)
    setNewPassword('')
    setPasswordError('')
    setShowPasswordModal(true)
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

  return (
    <div style={styles.page}>
      <div style={styles.toolbar}>
        <h2 style={{ margin: 0 }}>Usuarios</h2>
      </div>

      <div style={styles.filters}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="ID"
          value={filters.id}
          onChange={(e) => {
            const onlyDigits = e.target.value.replace(/\D/g, '')
            setFilters((f) => ({ ...f, id: onlyDigits }))
          }}
          style={styles.filterInput}
        />
        <input
          type="text"
          placeholder="nombre"
          value={filters.nombre}
          onChange={(e) => setFilters((f) => ({ ...f, nombre: e.target.value }))}
          style={styles.filterInput}
        />
        <input
          type="text"
          placeholder="correo"
          value={filters.email}
          onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))}
          style={styles.filterInput}
        />
      </div>

      {error && <div className="error-box">{error}</div>}

      <div style={styles.tableWrap}>
        {loading ? (
          <p style={{ padding: '20px', color: 'var(--muted)' }}>Cargando...</p>
        ) : usuarios.length === 0 ? (
          <p style={{ padding: '20px', color: 'var(--muted)' }}>No hay usuarios registrados.</p>
        ) : (
          <table>
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
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                  <td style={{ fontWeight: 600 }}>{u.email}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{u.rol}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '.85rem' }}>
                    {new Date(u.creadoEn).toLocaleString('es-ES')}
                  </td>
                  <td>
                    {u.rol === 'OPERADOR' ? (
                      <button className="btn-primary" onClick={() => openPasswordModal(u)} style={{ padding: '5px 12px', fontSize: '0.82rem' }}>
                        Editar contraseña
                      </button>
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
    background: '#fff',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
  },
  filterInput: { flex: '1 1 180px' },
  tableWrap: {
    background: '#fff',
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
    background: '#fff',
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
