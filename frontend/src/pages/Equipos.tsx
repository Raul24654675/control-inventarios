import { useEffect, useState, type FormEvent } from 'react'
import api from '../api'
import { useAuth } from '../useAuth'
import type { Equipo, Sector, Estado } from '../types'
import './Equipos.css'

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
    <div>
      <div className="page-head">
        <div>
          <h2 className="page-title">Equipos</h2>
          <p className="page-subtitle">Panel operativo de activos industriales</p>
        </div>
        {isAdmin && (
          <button className="btn-primary btn-new" onClick={openCreate}>
            <span>+</span>
            <span>Nuevo equipo</span>
          </button>
        )}
      </div>

      <form onSubmit={applyFilters} className="card filters-grid">
        <input
          className="field-input"
          placeholder="Nombre"
          value={filters.nombre}
          onChange={e => setFilters(f => ({ ...f, nombre: e.target.value }))}
        />
        <select
          className="field-select"
          value={filters.sector}
          onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
        >
          <option value="">Todos los sectores</option>
          {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="field-select"
          value={filters.estado}
          onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          className="field-input"
          placeholder="Ubicacion"
          value={filters.ubicacion}
          onChange={e => setFilters(f => ({ ...f, ubicacion: e.target.value }))}
        />
        <button type="submit" className="btn-primary">Filtrar</button>
        <button type="button" className="btn-ghost" onClick={clearFilters}>Limpiar</button>
      </form>

      {error && <div className="error-box">{error}</div>}

      <div className="table-card">
        {loading ? (
          <p className="empty-state">Cargando...</p>
        ) : equipos.length === 0 ? (
          <p className="empty-state">No hay equipos para mostrar.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Sector</th>
                <th>Estado</th>
                <th>Ubicacion</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {equipos.map(eq => (
                <tr key={eq.id}>
                  <td className="muted-small">{eq.id}</td>
                  <td><strong>{eq.nombre}</strong></td>
                  <td><span className={`tag ${sectorTag[eq.sector]}`}>{eq.sector}</span></td>
                  <td><span className={`tag ${estadoTag[eq.estado]}`}>{eq.estado}</span></td>
                  <td className="muted-small">{eq.ubicacion ?? '---'}</td>
                  {isAdmin && (
                    <td>
                      <div className="row-actions">
                        <button className="btn-outline" onClick={() => openEdit(eq)}>
                          Editar
                        </button>
                        <button className="btn-danger" onClick={() => handleDelete(eq.id)}>
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

      <div className="pagination">
        <button
          className="btn-ghost"
          disabled={filters.page <= 1}
          onClick={() => {
            const next = { ...filters, page: filters.page - 1 }
            setFilters(next)
            load(next)
          }}
        >
          Anterior
        </button>
        <span className="page-badge">Pagina {filters.page}</span>
        <button
          className="btn-ghost"
          disabled={equipos.length < filters.limit}
          onClick={() => {
            const next = { ...filters, page: filters.page + 1 }
            setFilters(next)
            load(next)
          }}
        >
          Siguiente
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 className="modal-title">{editing ? 'Editar equipo' : 'Nuevo equipo'}</h3>
                <div className="modal-subtitle">Gestion de informacion del activo</div>
              </div>
              <button type="button" className="modal-close" onClick={() => setShowForm(false)}>
                x
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <label>
                  <span className="form-label">NOMBRE</span>
                  <input
                    className="field-input"
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    required
                  />
                </label>

                <div className="modal-grid">
                  <label>
                    <span className="form-label">SECTOR</span>
                    <select
                      className="field-select"
                      value={form.sector}
                      onChange={e => setForm(f => ({ ...f, sector: e.target.value as Sector }))}
                      disabled={!isAdmin && !!editing}
                    >
                      {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>

                  <label>
                    <span className="form-label">ESTADO</span>
                    <select
                      className="field-select"
                      value={form.estado}
                      onChange={e => setForm(f => ({ ...f, estado: e.target.value as Estado }))}
                      disabled={!isAdmin && !!editing}
                    >
                      {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span className={`tag status-inline ${estadoTag[form.estado]}`}>{form.estado}</span>
                  </label>
                </div>

                <label>
                  <span className="form-label">UBICACION</span>
                  <input
                    className="field-input"
                    value={form.ubicacion}
                    onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))}
                  />
                </label>

                <label>
                  <span className="form-label">DESCRIPCION</span>
                  <textarea
                    className="field-textarea"
                    value={form.descripcion}
                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  />
                </label>

                {formError && <div className="error-box">{formError}</div>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
