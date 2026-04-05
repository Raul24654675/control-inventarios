import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../useAuth'
import type { Equipo, Sector, Estado } from '../types'
import './Equipos.css'

const SECTORES: Sector[] = ['Electrica', 'Neumatica', 'Electronica']
const ESTADOS: Estado[] = ['Activo', 'Inactivo', 'EnMantenimiento']
const BLOQUES = ['A', 'B', 'ALMACEN'] as const
const AULAS = ['201', '202', '203', '204', '301', '302', '303', '304'] as const

function splitUbicacion(ubicacion: string) {
  const raw = (ubicacion ?? '').trim().toUpperCase()

  if (!raw) {
    return { aula: '', bloque: '' }
  }

  if (raw === 'EN ALMACEN') {
    return { aula: '', bloque: 'ALMACEN' }
  }

  // Internal partial state: "-A", "-B", "-ALMACEN"
  if (raw.startsWith('-')) {
    const bloque = raw.slice(1)
    if (bloque === 'A' || bloque === 'B' || bloque === 'ALMACEN') {
      return { aula: '', bloque }
    }
    return { aula: '', bloque: '' }
  }

  // Internal partial state: "201-"
  if (raw.endsWith('-')) {
    const aula = raw.slice(0, -1)
    if (AULAS.includes(aula as (typeof AULAS)[number])) {
      return { aula, bloque: '' }
    }
    return { aula: '', bloque: '' }
  }

  const parts = raw.split('-')
  if (parts.length !== 2) {
    // Legacy values from DB are ignored in selector UI.
    return { aula: '', bloque: '' }
  }

  const [aula, bloque] = parts
  const aulaValida = AULAS.includes(aula as (typeof AULAS)[number])
  const bloqueValido = bloque === 'A' || bloque === 'B'

  if (!aulaValida || !bloqueValido) {
    return { aula: '', bloque: '' }
  }

  return { aula, bloque }
}

function buildUbicacion(aula: string, bloque: string) {
  if (bloque === 'ALMACEN') return 'EN ALMACEN'
  if (!aula && !bloque) return ''
  if (!aula && bloque) return `-${bloque}`
  if (aula && !bloque) return `${aula}-`
  return `${aula}-${bloque}`
}

function formatUbicacionLabel(ubicacion?: string | null) {
  if (!ubicacion) return '—'
  return ubicacion === 'EN ALMACEN' ? 'En almacén' : ubicacion
}

function formatEstadoLabel(estado: Estado | string) {
  if (estado === 'EnMantenimiento') return 'En mantenimiento'
  if (estado === 'ACTIVO') return 'Activo'
  if (estado === 'INACTIVO') return 'Inactivo'
  if (estado === 'MANTENIMIENTO') return 'En mantenimiento'
  return estado
}

const estadoTag: Record<Estado, string> = {
  Activo: 'tag-activo',
  Inactivo: 'tag-inactivo',
  EnMantenimiento: 'tag-mant',
}

const sectorTag: Record<Sector, string> = {
  Electrica: 'tag-electrica',
  Neumatica: 'tag-neumatica',
  Electronica: 'tag-mecanica',
}

interface Filters {
  id: string
  nombre: string
  sector: string
  estado: string
  ubicacion: string
  page: number
  limit: number
}

const EMPTY_FILTERS: Filters = { id: '', nombre: '', sector: '', estado: '', ubicacion: '', page: 1, limit: 15 }

interface EquipoForm {
  nombre: string
  sector: Sector
  estado: Estado
  descripcion: string
  ubicacion: string
}

const EMPTY_FORM: EquipoForm = { nombre: '', sector: 'Electrica', estado: 'Activo', descripcion: '', ubicacion: '' }

export default function Equipos() {
  const { rol } = useAuth()
  const isAdmin = rol === 'ADMIN'
  const [searchParams, setSearchParams] = useSearchParams()

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [tableMotionKey, setTableMotionKey] = useState(0)
  const [isClearingFilters, setIsClearingFilters] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [isClosingForm, setIsClosingForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isClosingDeleteConfirm, setIsClosingDeleteConfirm] = useState(false)
  const [pendingDeleteEquipo, setPendingDeleteEquipo] = useState<Pick<Equipo, 'id' | 'nombre'> | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editing, setEditing] = useState<Equipo | null>(null)
  const [form, setForm] = useState<EquipoForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const { aula: filtroAula, bloque: filtroBloque } = splitUbicacion(filters.ubicacion)
  const { aula: formAula, bloque: formBloque } = splitUbicacion(form.ubicacion)

  async function load(f: Filters) {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (f.id) params.set('id', f.id)
      if (f.nombre) params.set('nombre', f.nombre)
      if (f.sector) params.set('sector', f.sector)
      if (f.estado) params.set('estado', f.estado)
      if (f.ubicacion) params.set('ubicacion', f.ubicacion)
      params.set('page', String(f.page))
      params.set('limit', String(f.limit))
      const { data } = await api.get<Equipo[]>(`/equipos?${params.toString()}`)
      setEquipos(data)
      setTableMotionKey(k => k + 1)
    } catch {
      setError('No se pudo cargar la lista de equipos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(filters)
  }, [filters.id, filters.nombre, filters.sector, filters.estado, filters.ubicacion, filters.page, filters.limit])

  useEffect(() => {
    const openCreateParam = searchParams.get('createEquipo')
    if (openCreateParam !== '1' || !isAdmin) return

    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setIsClosingForm(false)
    setShowForm(true)

    const next = new URLSearchParams(searchParams)
    next.delete('createEquipo')
    setSearchParams(next, { replace: true })
  }, [isAdmin, searchParams, setSearchParams])

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    setIsClearingFilters(true)
    setTimeout(() => setIsClearingFilters(false), 430)
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setIsClosingForm(false)
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
    setIsClosingForm(false)
    setShowForm(true)
  }

  function closeFormModal() {
    setIsClosingForm(true)
    setTimeout(() => {
      setShowForm(false)
      setIsClosingForm(false)
    }, 300)
  }

  function openDeleteConfirm(eq: Pick<Equipo, 'id' | 'nombre'>) {
    setPendingDeleteEquipo(eq)
    setIsClosingDeleteConfirm(false)
    setShowDeleteConfirm(true)
  }

  function closeDeleteConfirm() {
    if (isClosingDeleteConfirm) return
    setIsClosingDeleteConfirm(true)
    setTimeout(() => {
      setShowDeleteConfirm(false)
      setIsClosingDeleteConfirm(false)
      setPendingDeleteEquipo(null)
    }, 300)
  }

  async function confirmDeleteEquipo() {
    if (!pendingDeleteEquipo) return
    setDeleteLoading(true)
    try {
      await api.delete(`/equipos/${pendingDeleteEquipo.id}`)
      closeDeleteConfirm()
      load(filters)
    } catch {
      setError('No se pudo eliminar el equipo.')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const ubicacionPayload =
      formBloque === 'ALMACEN'
        ? 'EN ALMACEN'
        : formAula && formBloque
          ? `${formAula}-${formBloque}`
          : ''

    if (!editing) {
      if (!ubicacionPayload || !form.descripcion.trim()) {
        setFormError('Para crear equipo debes completar ubicacion y descripcion.')
        return
      }
    }

    setFormLoading(true)
    try {
      const payload = { ...form, descripcion: form.descripcion.trim(), ubicacion: ubicacionPayload }

      if (editing) {
        await api.patch(`/equipos/${editing.id}`, payload)
      } else {
        await api.post('/equipos', payload)
      }
      closeFormModal()
      load(filters)
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

      <section className={`filters-card ${isClearingFilters ? 'is-clearing' : ''}`} aria-label="Filtros de equipos">
        <h3 className="filters-title">FILTROS</h3>
        <div className="filters-divider" aria-hidden="true" />

        <div className="filters-grid">
          <label className="filter-item" htmlFor="filter-id">
            <span className="filter-label">ID</span>
            <input
              id="filter-id"
              type="text"
              inputMode="numeric"
              placeholder="ID"
              value={filters.id}
              onChange={e => {
                const onlyDigits = e.target.value.replace(/\D/g, '')
                setFilters(f => ({ ...f, id: onlyDigits, page: 1 }))
              }}
              className="filter-control"
            />
          </label>

          <label className="filter-item" htmlFor="filter-nombre">
            <span className="filter-label">NOMBRE</span>
            <input
              id="filter-nombre"
              placeholder="Nombre"
              value={filters.nombre}
              onChange={e => setFilters(f => ({ ...f, nombre: e.target.value, page: 1 }))}
              className="filter-control"
            />
          </label>

          <label className="filter-item select-item" htmlFor="filter-sector">
            <span className="filter-label">CATEGORÍA</span>
            <span className="select-wrap">
              <select
                id="filter-sector"
                value={filters.sector}
                onChange={e => setFilters(f => ({ ...f, sector: e.target.value, page: 1 }))}
                className="filter-control"
              >
                <option value="">Todas las categorias</option>
                {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="filter-chevron" aria-hidden="true" />
            </span>
          </label>

          <label className="filter-item select-item" htmlFor="filter-estado">
            <span className="filter-label">ESTADO</span>
            <span className="select-wrap">
              <select
                id="filter-estado"
                value={filters.estado}
                onChange={e => setFilters(f => ({ ...f, estado: e.target.value, page: 1 }))}
                className="filter-control"
              >
                <option value="">Todos los estados</option>
                {ESTADOS.map(s => <option key={s} value={s}>{formatEstadoLabel(s)}</option>)}
              </select>
              <span className="filter-chevron" aria-hidden="true" />
            </span>
          </label>

          <label className="filter-item select-item" htmlFor="filter-bloque">
            <span className="filter-label">UBICACIÓN</span>
            <span className="select-wrap">
              <select
                id="filter-bloque"
                value={filtroBloque}
                onChange={e => {
                  const bloque = e.target.value
                  setFilters(f => ({ ...f, ubicacion: buildUbicacion(filtroAula, bloque), page: 1 }))
                }}
                className="filter-control"
              >
                <option value="">Todas las ubicaciones</option>
                {BLOQUES.map(b => (
                  <option key={b} value={b}>
                    {b === 'ALMACEN' ? 'En almacén' : `Bloque ${b}`}
                  </option>
                ))}
              </select>
              <span className="filter-chevron" aria-hidden="true" />
            </span>
          </label>

          <label className="filter-item select-item" htmlFor="filter-aula">
            <span className="filter-label">AULA</span>
            <span className="select-wrap">
              <select
                id="filter-aula"
                value={filtroAula}
                onChange={e => {
                  const aula = e.target.value
                  setFilters(f => ({ ...f, ubicacion: buildUbicacion(aula, filtroBloque), page: 1 }))
                }}
                disabled={!filtroBloque || filtroBloque === 'ALMACEN'}
                className="filter-control"
              >
                <option value="">Todas las aulas</option>
                {AULAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <span className="filter-chevron" aria-hidden="true" />
            </span>
          </label>
        </div>

        <div className="filters-divider" aria-hidden="true" />
        <div className="filters-actions">
          <button type="button" className="btn-ghost" onClick={clearFilters}>Limpiar</button>
        </div>
      </section>

      {error && <div className="error-box">{error}</div>}

      <div style={styles.tableWrap} className={`equipos-table-wrap ${loading && equipos.length > 0 ? 'is-filtering' : ''}`}>
        {loading && equipos.length === 0 ? (
          <p style={{ padding: '20px', color: 'var(--muted)' }}>Cargando...</p>
        ) : equipos.length === 0 ? (
          <p style={{ padding: '20px', color: 'var(--muted)' }}>No hay equipos para mostrar.</p>
        ) : (
          <table className="equipos-table equipos-table-animated" key={tableMotionKey}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Categoria</th>
                <th>Estado</th>
                <th>Ubicación</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody className="equipos-tbody">
              {equipos.map((eq, index) => (
                <tr key={eq.id} className="equipos-row" style={{ animationDelay: `${index * 90}ms` }}>
                  <td style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{eq.id}</td>
                  <td style={{ fontWeight: 600 }}>{eq.nombre}</td>
                  <td><span className={`tag data-chip ${sectorTag[eq.sector]}`} style={{ animationDelay: `${index * 90 + 90}ms` }}>{eq.sector}</span></td>
                  <td><span className={`tag data-chip ${estadoTag[eq.estado]}`} style={{ animationDelay: `${index * 90 + 140}ms` }}>{formatEstadoLabel(eq.estado)}</span></td>
                  <td><span className="ubicacion-pill data-chip" style={{ animationDelay: `${index * 90 + 190}ms` }}>{formatUbicacionLabel(eq.ubicacion)}</span></td>
                  {isAdmin && (
                    <td>
                      <div className="row-actions">
                        <button className="btn-ghost equipos-edit-btn action-btn" onClick={() => openEdit(eq)} style={{ padding: '5px 12px', fontSize: '0.82rem' }}>
                          Editar
                        </button>
                        <button className="btn-danger equipos-delete-btn action-btn" onClick={() => openDeleteConfirm(eq)} style={{ padding: '5px 12px', fontSize: '0.82rem' }}>
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
            setFilters(next)
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
            setFilters(next)
          }}
          style={{ padding: '6px 14px' }}
        >
          Siguiente →
        </button>
      </div>

      {showForm && (
        <div className={`edit-modal-overlay ${isClosingForm ? 'is-closing' : ''}`} onClick={closeFormModal}>
          <div className={`edit-modal-card ${isClosingForm ? 'is-closing' : ''}`} onClick={e => e.stopPropagation()}>
            <h3 className="edit-modal-title">{editing ? 'Editar equipo' : 'Nuevo equipo'}</h3>
            <form onSubmit={handleSubmit} className="edit-modal-form">
              <label className="edit-modal-field" style={{ animationDelay: '40ms' }}>
                Nombre *
                <input
                  className="modal-control"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="ingresa el nombre del equipo"
                  required
                />
              </label>
              <div className="edit-modal-grid">
                <label className="edit-modal-field" style={{ animationDelay: '90ms' }}>
                  Categoria *
                  <span className="edit-modal-select-wrap">
                    <select
                      className="modal-control"
                      value={form.sector}
                      onChange={e => setForm(f => ({ ...f, sector: e.target.value as Sector }))}
                      disabled={!isAdmin && !!editing}
                    >
                      {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span className="edit-modal-chevron" aria-hidden="true" />
                  </span>
                </label>
                <label className="edit-modal-field" style={{ animationDelay: '140ms' }}>
                  Estado *
                  <span className="edit-modal-select-wrap">
                    <select
                      className="modal-control"
                      value={form.estado}
                      onChange={e => setForm(f => ({ ...f, estado: e.target.value as Estado }))}
                      disabled={!isAdmin && !!editing}
                    >
                      {ESTADOS.map(s => <option key={s} value={s}>{formatEstadoLabel(s)}</option>)}
                    </select>
                    <span className="edit-modal-chevron" aria-hidden="true" />
                  </span>
                </label>
              </div>
              <label className="edit-modal-field" style={{ animationDelay: '190ms' }}>
                Ubicacion {editing ? '' : '*'}
                <span className="edit-modal-select-wrap">
                  <select
                    className="modal-control"
                    value={formBloque}
                    onChange={e => {
                      const bloque = e.target.value
                      setForm(f => ({ ...f, ubicacion: buildUbicacion(formAula, bloque) }))
                    }}
                  >
                    <option value="" disabled>Selecciona bloque</option>
                    {BLOQUES.map(b => (
                      <option key={b} value={b}>
                        {b === 'ALMACEN' ? 'En almacén' : `Bloque ${b}`}
                      </option>
                    ))}
                  </select>
                  <span className="edit-modal-chevron" aria-hidden="true" />
                </span>
              </label>
              <label className="edit-modal-field" style={{ animationDelay: '240ms' }}>
                Aula
                {formBloque === 'ALMACEN' ? (
                  <input className="modal-control" value="Ubicado en el almacén" disabled />
                ) : (
                  <span className="edit-modal-select-wrap">
                    <select
                      className="modal-control"
                      value={formAula}
                      onChange={e => {
                        const aula = e.target.value
                        setForm(f => ({ ...f, ubicacion: buildUbicacion(aula, formBloque) }))
                      }}
                      disabled={!formBloque}
                    >
                      <option value="" disabled>Selecciona aula</option>
                      {AULAS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <span className="edit-modal-chevron" aria-hidden="true" />
                  </span>
                )}
              </label>
              <label className="edit-modal-field" style={{ animationDelay: '290ms' }}>
                Descripción {editing ? '' : '*'}
                <input
                  className="modal-control"
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="ingresa una descripcion del equipo"
                  required={!editing}
                />
              </label>
              <div className="edit-modal-info" style={{ animationDelay: '330ms' }}>
                Debes completar nombre, descripcion, ubicacion y aula para guardar el equipo.
                Si eliges "En almacén", no es necesario seleccionar aula.
              </div>
              {formError && <div className="error-box" style={styles.formErrorBox}>{formError}</div>}
              <div className="edit-modal-actions">
                <button type="submit" className="btn-primary edit-modal-save action-btn" disabled={formLoading} style={{ flex: 1, borderRadius: '10px' }}>
                  {formLoading ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" className="btn-ghost edit-modal-cancel action-btn" onClick={closeFormModal} style={{ borderRadius: '10px' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className={`equipos-delete-confirm-overlay ${isClosingDeleteConfirm ? 'is-closing' : ''}`} onClick={closeDeleteConfirm}>
          <div className={`equipos-delete-confirm-card ${isClosingDeleteConfirm ? 'is-closing' : ''}`} onClick={e => e.stopPropagation()}>
            <h4>Seguro que quiere eliminar el equipo?</h4>
            <p>Esta opcion no se puede deshacer.</p>
            <div className="equipos-delete-confirm-actions">
              <button type="button" className="btn-ghost" onClick={closeDeleteConfirm} disabled={deleteLoading}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger equipos-delete-btn action-btn"
                onClick={confirmDeleteEquipo}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Eliminando...' : `Eliminar ${pendingDeleteEquipo?.nombre ?? ''}`}
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
    boxShadow: 'var(--shadow-soft)',
  },
  filterControl: {
    flex: '1 1 160px',
    background: 'var(--surface-soft)',
    color: 'var(--text-main)',
    border: '1px solid var(--border-main)',
    borderRadius: '10px',
    height: '50px',
    padding: '0 12px',
  },
  tableWrap: {
    background: 'var(--surface)',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    marginBottom: '14px',
    boxShadow: 'var(--shadow-soft)',
  },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '8px' },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(20,30,32,.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: '18px',
    padding: '30px 28px',
    width: '100%',
    maxWidth: '520px',
    boxShadow: '0 24px 70px rgba(20,30,32,.22)',
    border: '1px solid var(--border-main)',
  },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '14px' },
  label: { display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.85rem', color: 'var(--muted)' },
  formErrorBox: { marginTop: '-4px', marginBottom: '2px' },
  infoBox: {
    marginBottom: '14px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid color-mix(in srgb, var(--green-main) 32%, var(--border-main))',
    background: 'color-mix(in srgb, var(--green-main) 12%, var(--surface))',
    color: 'var(--text-main)',
    fontSize: '0.86rem',
    lineHeight: 1.35,
  },
}
