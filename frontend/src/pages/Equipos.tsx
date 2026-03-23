import { useEffect, useState, type FormEvent } from 'react'
import api from '../api'
import { useAuth } from '../AuthContext'
import type { Equipo, Sector, Estado } from '../types'

const SECTORES: Sector[] = ['ELECTRICA', 'NEUMATICA', 'MECANICA']
const ESTADOS: Estado[] = ['ACTIVO', 'INACTIVO', 'MANTENIMIENTO']

const estadoTag: Record<Estado, string> = {
  ACTIVO: 'tag-activo',
  INACTIVO: 'tag-inactivo',
  MANTENIMIENTO: 'tag-mant',
}

const sectorTag: Record<Sector, string> = {
  ELECTRICA: 'tag-electrica',
  NEUMATICA: 'tag-neumatica',
  MECANICA: 'tag-mecanica',
}

interface Filters {
  nombre: string
  sector: string
  estado: string
  ubicacion: string
  page: number
  limit: number
}

const EMPTY_FILTERS: Filters = { nombre: '', sector: '', estado: '', ubicacion: '', page: 1, limit: 15 }

interface EquipoForm {
  nombre: string
  sector: Sector
  estado: Estado
  descripcion: string
  ubicacion: string
}

const EMPTY_FORM: EquipoForm = { nombre: '', sector: 'ELECTRICA', estado: 'ACTIVO', descripcion: '', ubicacion: '' }

export default function Equipos() {
  const { rol } = useAuth()
  const isAdmin = rol === 'ADMIN'

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Equipo | null>(null)
  const [form, setForm] = useState<EquipoForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  async function load(f: Filters = filters) {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (f.nombre) params.set('nombre', f.nombre)
      if (f.sector) params.set('sector', f.sector)
      if (f.estado) params.set('estado', f.estado)
      if (f.ubicacion) params.set('ubicacion', f.ubicacion)
      params.set('page', String(f.page))
      params.set('limit', String(f.limit))
      const { data } = await api.get<Equipo[]>(`/equipos?${params.toString()}`)
      setEquipos(data)
    } catch {
      setError('No se pudo cargar la lista de equipos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function applyFilters(e: FormEvent) {
    e.preventDefault()
    const next = { ...filters, page: 1 }
    setFilters(next)
    load(next)
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    load(EMPTY_FILTERS)
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(eq: Equipo) {
    setEditing(eq)
    setForm({
      nombre: eq.nombre,
      sector: eq.sector,
      estado: eq.estado,
      descripcion: eq.descripcion ?? '',
      ubicacion: eq.ubicacion ?? '',
    })
    setFormError('')
    setShowForm(true)
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este equipo? Esta acción no se puede deshacer.')) return
    try {
      await api.delete(`/equipos/${id}`)
      load()
    } catch {
      alert('No se pudo eliminar el equipo.')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      if (editing) {
        await api.patch(`/equipos/${editing.id}`, form)
      } else {
        await api.post('/equipos', form)
      }
      setShowForm(false)
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setFormError(msg ?? 'Error al guardar el equipo.')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.toolbar}>
        <h2 style={{ margin: 0 }}>Equipos</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={openCreate}>+ Nuevo equipo</button>
        )}
      </div>

      <form onSubmit={applyFilters} style={styles.filters}>
        <input
          placeholder="Nombre"
          value={filters.nombre}
          onChange={e => setFilters(f => ({ ...f, nombre: e.target.value }))}
          style={styles.filterInput}
        />
        <select
          value={filters.sector}
          onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
          style={styles.filterInput}
        >
          <option value="">Todos los sectores</option>
          {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filters.estado}
          onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}
          style={styles.filterInput}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          placeholder="Ubicación"
          value={filters.ubicacion}
          onChange={e => setFilters(f => ({ ...f, ubicacion: e.target.value }))}
          style={styles.filterInput}
        />
        <button type="submit" className="btn-primary">Filtrar</button>
        <button type="button" className="btn-ghost" onClick={clearFilters}>Limpiar</button>
      </form>

      {error && <div className="error-box">{error}</div>}

      <div style={styles.tableWrap}>
        {loading ? (
          <p style={{ padding: '20px', color: 'var(--muted)' }}>Cargando...</p>
        ) : equipos.length === 0 ? (
          <p style={{ padding: '20px', color: 'var(--muted)' }}>No hay equipos para mostrar.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Sector</th>
                <th>Estado</th>
                <th>Ubicación</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {equipos.map(eq => (
                <tr key={eq.id}>
                  <td style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{eq.id}</td>
                  <td style={{ fontWeight: 600 }}>{eq.nombre}</td>
                  <td><span className={`tag ${sectorTag[eq.sector]}`}>{eq.sector}</span></td>
                  <td><span className={`tag ${estadoTag[eq.estado]}`}>{eq.estado}</span></td>
                  <td style={{ color: 'var(--muted)', fontSize: '.88rem' }}>{eq.ubicacion ?? '—'}</td>
                  {isAdmin && (
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-ghost" onClick={() => openEdit(eq)} style={{ padding: '5px 12px', fontSize: '0.82rem' }}>
                          Editar
                        </button>
                        <button className="btn-danger" onClick={() => handleDelete(eq.id)} style={{ padding: '5px 12px', fontSize: '0.82rem' }}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={styles.pagination}>
        <button
          className="btn-ghost"
          disabled={filters.page <= 1}
          onClick={() => {
            const next = { ...filters, page: filters.page - 1 }
            setFilters(next); load(next)
          }}
          style={{ padding: '6px 14px' }}
        >
          ← Anterior
        </button>
        <span style={{ color: 'var(--muted)', fontSize: '.88rem' }}>Página {filters.page}</span>
        <button
          className="btn-ghost"
          disabled={equipos.length < filters.limit}
          onClick={() => {
            const next = { ...filters, page: filters.page + 1 }
            setFilters(next); load(next)
          }}
          style={{ padding: '6px 14px' }}
        >
          Siguiente →
        </button>
      </div>

      {showForm && (
        <div style={styles.overlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>{editing ? 'Editar equipo' : 'Nuevo equipo'}</h3>
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <label style={styles.label}>
                Nombre *
                <input
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  required
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={styles.label}>
                  Sector *
                  <select
                    value={form.sector}
                    onChange={e => setForm(f => ({ ...f, sector: e.target.value as Sector }))}
                    disabled={!isAdmin && !!editing}
                  >
                    {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label style={styles.label}>
                  Estado *
                  <select
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value as Estado }))}
                    disabled={!isAdmin && !!editing}
                  >
                    {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <label style={styles.label}>
                Ubicación
                <input
                  value={form.ubicacion}
                  onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))}
                />
              </label>
              <label style={styles.label}>
                Descripción
                <input
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                />
              </label>
              {formError && <div className="error-box">{formError}</div>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="submit" className="btn-primary" disabled={formLoading} style={{ flex: 1, borderRadius: '10px' }}>
                  {formLoading ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)} style={{ borderRadius: '10px' }}>
                  Cancelar
                </button>
              </div>
            </form>
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
  filterInput: { flex: '1 1 160px' },
  tableWrap: {
    background: '#fff',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    marginBottom: '14px',
  },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '8px' },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(20,30,32,.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    background: '#fff',
    borderRadius: '18px',
    padding: '30px 28px',
    width: '100%',
    maxWidth: '520px',
    boxShadow: '0 24px 70px rgba(20,30,32,.22)',
  },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '14px' },
  label: { display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.85rem', color: 'var(--muted)' },
}
