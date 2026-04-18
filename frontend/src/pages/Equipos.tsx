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
  const canEdit = rol === 'ADMIN' || rol === 'OPERADOR'
  const [searchParams, setSearchParams] = useSearchParams()

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS)
  const [tableMotionKey, setTableMotionKey] = useState(0)
  const [isClearingFilters, setIsClearingFilters] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [isClosingForm, setIsClosingForm] = useState(false)
  const [editing, setEditing] = useState<Equipo | null>(null)
  const [form, setForm] = useState<EquipoForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Estado para el modal de cambio de estado
  const [showEstadoModal, setShowEstadoModal] = useState(false)
  const [isClosingEstadoModal, setIsClosingEstadoModal] = useState(false)
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Equipo | null>(null)
  const [estadoForm, setEstadoForm] = useState({
    estado: 'Inactivo' as Estado,
    // Campos para Inactivo
    motivo: '',
    descripcion: '',
    tiempoEstimado: 'Indefinido' as const,
    accionRequerida: 'Reparacion' as const,
    prioridad: 'Media' as const,
    evidenciaUrl: '',
    // Campos para EnMantenimiento
    tipoMantenimiento: 'Preventivo' as const,
    motivoMantenimiento: 'ProgramacionPeriodica' as const,
    fechaInicio: '',
    horaInicio: '',
    descripcionTecnica: '',
    tiempoEstimadoMantenimiento: 'Horas' as 'Horas' | 'Dias' | 'FechaEstimada',
    fechaFinEstimada: '',
    prioridadMantenimiento: 'Media' as const,
    costoManoObra: '',
    costoRepuestos: '',
    costoTotal: '',
    evidenciaMantenimiento: '',
  })
  const [estadoError, setEstadoError] = useState('')
  const [estadoLoading, setEstadoLoading] = useState(false)

  const { aula: draftAula, bloque: draftBloque } = splitUbicacion(draftFilters.ubicacion)
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

  function applyFilters() {
    setFilters(current => ({ ...draftFilters, page: 1, limit: current.limit }))
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    setDraftFilters(EMPTY_FILTERS)
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

  function openEstadoModal(eq: Equipo) {
    setEquipoSeleccionado(eq)
    setEstadoForm({
      estado: 'Inactivo',
      motivo: '',
      descripcion: '',
      tiempoEstimado: 'Indefinido',
      accionRequerida: 'Reparacion',
      prioridad: 'Media',
      evidenciaUrl: '',
      tipoMantenimiento: 'Preventivo',
      motivoMantenimiento: 'ProgramacionPeriodica',
      fechaInicio: '',
      horaInicio: '',
      descripcionTecnica: '',
      tiempoEstimadoMantenimiento: 'Horas',
      fechaFinEstimada: '',
      prioridadMantenimiento: 'Media',
      costoManoObra: '',
      costoRepuestos: '',
      costoTotal: '',
      evidenciaMantenimiento: '',
    })
    setEstadoError('')
    setIsClosingEstadoModal(false)
    setShowEstadoModal(true)
  }

  function closeEstadoModal() {
    setIsClosingEstadoModal(true)
    setTimeout(() => {
      setShowEstadoModal(false)
      setIsClosingEstadoModal(false)
    }, 300)
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

  async function handleUpdateEstado(e: FormEvent) {
    e.preventDefault()
    setEstadoError('')

    if (!equipoSeleccionado) return

    // Validar campos obligatorios
    if (estadoForm.estado === 'Inactivo' && !estadoForm.motivo) {
      setEstadoError('Debes seleccionar un motivo de inactividad.')
      return
    }

    if (estadoForm.estado === 'Inactivo' && !estadoForm.descripcion.trim()) {
      setEstadoError('La descripción detallada es obligatoria.')
      return
    }

    if (estadoForm.estado === 'EnMantenimiento' && !estadoForm.fechaInicio) {
      setEstadoError('La fecha de inicio es obligatoria.')
      return
    }

    if (estadoForm.estado === 'EnMantenimiento' && !estadoForm.horaInicio) {
      setEstadoError('La hora de inicio es obligatoria.')
      return
    }

    if (estadoForm.estado === 'EnMantenimiento' && !estadoForm.descripcionTecnica.trim()) {
      setEstadoError('La descripción técnica es obligatoria.')
      return
    }

    setEstadoLoading(true)
    try {
      const payload = {
        estado: estadoForm.estado,
        ...(estadoForm.estado === 'Inactivo' && {
          motivo: estadoForm.motivo,
          descripcion: estadoForm.descripcion,
          tiempoEstimado: estadoForm.tiempoEstimado,
          accionRequerida: estadoForm.accionRequerida,
          prioridad: estadoForm.prioridad,
          evidenciaUrl: estadoForm.evidenciaUrl,
        }),
        ...(estadoForm.estado === 'EnMantenimiento' && {
          tipoMantenimiento: estadoForm.tipoMantenimiento,
          motivoMantenimiento: estadoForm.motivoMantenimiento,
          fechaInicio: estadoForm.fechaInicio,
          horaInicio: estadoForm.horaInicio,
          descripcionTecnica: estadoForm.descripcionTecnica,
          tiempoEstimadoMantenimiento: estadoForm.tiempoEstimadoMantenimiento,
          fechaFinEstimada: estadoForm.fechaFinEstimada,
          prioridadMantenimiento: estadoForm.prioridadMantenimiento,
          costoManoObra: estadoForm.costoManoObra,
          costoRepuestos: estadoForm.costoRepuestos,
          costoTotal: estadoForm.costoTotal,
          evidenciaMantenimiento: estadoForm.evidenciaMantenimiento,
        }),
      }

      await api.patch(`/equipos/${equipoSeleccionado.id}/estado`, payload)
      closeEstadoModal()
      load(filters)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setEstadoError(msg ?? 'Error al actualizar el estado.')
    } finally {
      setEstadoLoading(false)
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
              value={draftFilters.id}
              onChange={e => {
                const onlyDigits = e.target.value.replace(/\D/g, '')
                setDraftFilters(f => ({ ...f, id: onlyDigits }))
              }}
              className="filter-control"
            />
          </label>

          <label className="filter-item" htmlFor="filter-nombre">
            <span className="filter-label">NOMBRE</span>
            <input
              id="filter-nombre"
              placeholder="Nombre"
              value={draftFilters.nombre}
              onChange={e => setDraftFilters(f => ({ ...f, nombre: e.target.value }))}
              className="filter-control"
            />
          </label>

          <label className="filter-item select-item" htmlFor="filter-sector">
            <span className="filter-label">CATEGORÍA</span>
            <span className="select-wrap">
              <select
                id="filter-sector"
                value={draftFilters.sector}
                onChange={e => setDraftFilters(f => ({ ...f, sector: e.target.value }))}
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
                value={draftFilters.estado}
                onChange={e => setDraftFilters(f => ({ ...f, estado: e.target.value }))}
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
                value={draftBloque}
                onChange={e => {
                  const bloque = e.target.value
                  setDraftFilters(f => ({ ...f, ubicacion: buildUbicacion(draftAula, bloque) }))
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
                value={draftAula}
                onChange={e => {
                  const aula = e.target.value
                  setDraftFilters(f => ({ ...f, ubicacion: buildUbicacion(aula, draftBloque) }))
                }}
                disabled={!draftBloque || draftBloque === 'ALMACEN'}
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
          <button type="button" className="btn-primary" onClick={applyFilters}>Filtrar</button>
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
                {canEdit && <th>Acciones</th>}
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
                  {canEdit && (
                    <td>
                      <div className="row-actions">
                        <button 
                          className="btn-outline equipos-status-btn action-btn" 
                          onClick={() => openEstadoModal(eq)} 
                          style={{ padding: '5px 12px', fontSize: '0.82rem', marginRight: '6px' }}
                        >
                          Estado
                        </button>
                        <button className="btn-ghost equipos-edit-btn action-btn" onClick={() => openEdit(eq)} style={{ padding: '5px 12px', fontSize: '0.82rem' }}>
                          Editar
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
        <div 
          className={`edit-modal-overlay ${isClosingForm ? 'is-closing' : ''}`} 
          onClick={closeFormModal}
          onWheel={(e) => {
            // Permitir scroll/rueda en los selects abiertos
            const target = e.target as HTMLElement
            if (target.tagName === 'SELECT' || target.closest('.edit-modal-card')) {
              e.stopPropagation()
            }
          }}
          onScroll={(e) => {
            // Permitir que el scroll del trackpad se propague al modal
            e.stopPropagation()
          }}
        >
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

      {showEstadoModal && equipoSeleccionado && (
        <div 
          style={styles.overlay} 
          onClick={closeEstadoModal}
          onWheel={(e) => {
            // Permitir scroll/rueda en los selects abiertos
            const target = e.target as HTMLElement
            if (target.tagName === 'SELECT' || target.closest('[style*="maxWidth"]')) {
              e.stopPropagation()
            }
          }}
          onScroll={(e) => {
            e.stopPropagation()
          }}
        >
          <div
            style={{
              ...styles.modal,
              animation: isClosingEstadoModal ? 'none' : 'equipos-modal-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              opacity: isClosingEstadoModal ? 0 : 1,
              transform: isClosingEstadoModal ? 'scale(0.85)' : 'scale(1)',
              transition: 'all 0.3s ease-out',
              maxWidth: '640px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4em' }}>Cambiar estado</h2>
            <p style={{ margin: '0 0 20px 0', color: 'var(--muted)', fontSize: '0.9em' }}>
              Equipo: <strong>{equipoSeleccionado.nombre}</strong> (ID: {equipoSeleccionado.id})
            </p>

            <form onSubmit={handleUpdateEstado}>
              {/* Estado del equipo - Siempre visible */}
              <label className="edit-modal-field">
                <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Estado del equipo *</span>
                <span className="edit-modal-select-wrap">
                  <select
                    className="modal-control"
                    value={estadoForm.estado}
                    onChange={e => setEstadoForm(f => ({ ...f, estado: e.target.value as any }))}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="EnMantenimiento">En mantenimiento</option>
                  </select>
                  <span className="edit-modal-chevron" aria-hidden="true" />
                </span>
              </label>

              {estadoForm.estado === 'Inactivo' && (
                <>
                  {/* Fila 1: Estado y Motivo - 2 columnas */}
                  <div className="estado-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <label className="edit-modal-field">
                      <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Motivo de inactividad *</span>
                      <span className="edit-modal-select-wrap">
                        <select
                          className="modal-control"
                          value={estadoForm.motivo}
                          onChange={e => setEstadoForm(f => ({ ...f, motivo: e.target.value }))}
                          required
                        >
                          <option value="">Selecciona un motivo</option>
                          <option value="FueraDeServicio">Fuera de servicio</option>
                          <option value="SinUsoTemporal">Sin uso temporal</option>
                          <option value="AveriaDetectada">Avería detectada</option>
                          <option value="FaltaDeOperador">Falta de operador</option>
                          <option value="Obsolescencia">Obsolescencia</option>
                          <option value="BajaAdministrativa">Baja administrativa</option>
                          <option value="EnEsperaDeRepuestos">En espera de repuestos</option>
                          <option value="DesconectadoPorSeguridad">Desconectado por seguridad</option>
                        </select>
                        <span className="edit-modal-chevron" aria-hidden="true" />
                      </span>
                    </label>
                  </div>

                  {/* Fila 2: Descripción - Full width */}
                  <label className="edit-modal-field">
                    <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Descripción detallada *</span>
                    <textarea
                      className="modal-control"
                      value={estadoForm.descripcion}
                      onChange={e => setEstadoForm(f => ({ ...f, descripcion: e.target.value }))}
                      placeholder="Qué ocurrió, qué se observó, qué impide su uso"
                      style={{ minHeight: '100px', fontFamily: 'inherit', padding: '10px', resize: 'vertical' }}
                      required
                    />
                  </label>

                  {/* Fila 3: Tiempo, Acción, Prioridad - 3 columnas */}
                  <div className="estado-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <label className="edit-modal-field">
                      <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Tiempo estimado de inactividad</span>
                      <span className="edit-modal-select-wrap">
                        <select
                          className="modal-control"
                          value={estadoForm.tiempoEstimado}
                          onChange={e => setEstadoForm(f => ({ ...f, tiempoEstimado: e.target.value as any }))}
                        >
                          <option value="Horas">Horas</option>
                          <option value="Dias">Días</option>
                          <option value="Indefinido">Indefinido</option>
                        </select>
                        <span className="edit-modal-chevron" aria-hidden="true" />
                      </span>
                    </label>

                    <label className="edit-modal-field">
                      <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Acción requerida</span>
                      <span className="edit-modal-select-wrap">
                        <select
                          className="modal-control"
                          value={estadoForm.accionRequerida}
                          onChange={e => setEstadoForm(f => ({ ...f, accionRequerida: e.target.value as any }))}
                        >
                          <option value="Inspeccion">Inspección</option>
                          <option value="Reparacion">Reparación</option>
                          <option value="Repuesto">Repuesto</option>
                          <option value="Autorizacion">Autorización</option>
                          <option value="Reemplazo">Reemplazo</option>
                        </select>
                        <span className="edit-modal-chevron" aria-hidden="true" />
                      </span>
                    </label>

                    <label className="edit-modal-field">
                      <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Prioridad</span>
                      <span className="edit-modal-select-wrap">
                        <select
                          className="modal-control"
                          value={estadoForm.prioridad}
                          onChange={e => setEstadoForm(f => ({ ...f, prioridad: e.target.value as any }))}
                        >
                          <option value="Baja">Baja</option>
                          <option value="Media">Media</option>
                          <option value="Alta">Alta</option>
                          <option value="Critica">Crítica</option>
                        </select>
                        <span className="edit-modal-chevron" aria-hidden="true" />
                      </span>
                    </label>
                  </div>

                  {/* Fila 4: Evidencia - Full width */}
                  <label className="edit-modal-field">
                    <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Evidencia (URL de imagen)</span>
                    <input
                      type="url"
                      className="modal-control"
                      value={estadoForm.evidenciaUrl}
                      onChange={e => setEstadoForm(f => ({ ...f, evidenciaUrl: e.target.value }))}
                      placeholder="https://ejemplo.com/foto.jpg"
                    />
                  </label>
                </>
              )}

              {estadoForm.estado === 'EnMantenimiento' && (
                <>
                  {/* Fila 1: Tipo y Motivo de mantenimiento - 2 columnas */}
                  <div className="estado-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <label className="edit-modal-field">
                      <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Tipo de mantenimiento *</span>
                      <span className="edit-modal-select-wrap">
                        <select
                          className="modal-control"
                          value={estadoForm.tipoMantenimiento}
                          onChange={e => setEstadoForm(f => ({ ...f, tipoMantenimiento: e.target.value as any }))}
                        >
                          <option value="Preventivo">Preventivo</option>
                          <option value="Correctivo">Correctivo</option>
                          <option value="Predictivo">Predictivo</option>
                          <option value="Calibracion">Calibración</option>
                          <option value="LimpiezaTecnica">Limpieza técnica</option>
                          <option value="RevisionGeneral">Revisión general</option>
                          <option value="SustitucionPiezas">Sustitución de piezas</option>
                        </select>
                        <span className="edit-modal-chevron" aria-hidden="true" />
                      </span>
                    </label>

                    <label className="edit-modal-field">
                      <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Motivo del mantenimiento *</span>
                      <span className="edit-modal-select-wrap">
                        <select
                          className="modal-control"
                          value={estadoForm.motivoMantenimiento}
                          onChange={e => setEstadoForm(f => ({ ...f, motivoMantenimiento: e.target.value as any }))}
                        >
                          <option value="FalloDetectado">Fallo detectado</option>
                          <option value="ProgramacionPeriodica">Programación periódica</option>
                          <option value="Desgaste">Desgaste</option>
                          <option value="RuidoAnormal">Ruido anormal</option>
                          <option value="BajoRendimiento">Bajo rendimiento</option>
                          <option value="ErrorSistema">Error del sistema</option>
                          <option value="InspeccionObligatoria">Inspección obligatoria</option>
                        </select>
                        <span className="edit-modal-chevron" aria-hidden="true" />
                      </span>
                    </label>
                  </div>

                  {/* Fila 2: Fecha y Hora de inicio - 2 columnas */}
                  <div className="estado-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <label className="edit-modal-field">
                      <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Fecha de inicio *</span>
                      <input
                        type="date"
                        className="modal-control"
                        value={estadoForm.fechaInicio}
                        onChange={e => setEstadoForm(f => ({ ...f, fechaInicio: e.target.value }))}
                        required
                      />
                    </label>

                    <label className="edit-modal-field">
                      <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Hora de inicio *</span>
                      <input
                        type="time"
                        className="modal-control"
                        value={estadoForm.horaInicio}
                        onChange={e => setEstadoForm(f => ({ ...f, horaInicio: e.target.value }))}
                        required
                      />
                    </label>
                  </div>

                  {/* Fila 3: Descripción técnica - Full width */}
                  <label className="edit-modal-field">
                    <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Descripción técnica *</span>
                    <textarea
                      className="modal-control"
                      value={estadoForm.descripcionTecnica}
                      onChange={e => setEstadoForm(f => ({ ...f, descripcionTecnica: e.target.value }))}
                      placeholder="Qué presenta el equipo, qué se encontró, qué se va a realizar"
                      style={{ minHeight: '100px', fontFamily: 'inherit', padding: '10px', resize: 'vertical' }}
                      required
                    />
                  </label>

                  {/* Fila 4: Tiempo estimado y Prioridad - 2 columnas */}
                  <div className="estado-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <label className="edit-modal-field">
                      <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Tiempo estimado</span>
                      <span className="edit-modal-select-wrap">
                        <select
                          className="modal-control"
                          value={estadoForm.tiempoEstimadoMantenimiento}
                          onChange={e => setEstadoForm(f => ({ ...f, tiempoEstimadoMantenimiento: e.target.value as any }))}
                        >
                          <option value="Horas">Horas</option>
                          <option value="Dias">Días</option>
                          <option value="FechaEstimada">Fecha estimada de finalización</option>
                        </select>
                        <span className="edit-modal-chevron" aria-hidden="true" />
                      </span>
                    </label>

                    <label className="edit-modal-field">
                      <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Nivel de prioridad</span>
                      <span className="edit-modal-select-wrap">
                        <select
                          className="modal-control"
                          value={estadoForm.prioridadMantenimiento}
                          onChange={e => setEstadoForm(f => ({ ...f, prioridadMantenimiento: e.target.value as any }))}
                        >
                          <option value="Baja">Baja</option>
                          <option value="Media">Media</option>
                          <option value="Alta">Alta</option>
                          <option value="Critica">Crítica</option>
                        </select>
                        <span className="edit-modal-chevron" aria-hidden="true" />
                      </span>
                    </label>
                  </div>

                  {/* Fila 5: Fecha fin estimada - Condicional */}
                  {estadoForm.tiempoEstimadoMantenimiento === 'FechaEstimada' && (
                    <label className="edit-modal-field">
                      <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Fecha estimada de finalización</span>
                      <input
                        type="date"
                        className="modal-control"
                        value={estadoForm.fechaFinEstimada}
                        onChange={e => setEstadoForm(f => ({ ...f, fechaFinEstimada: e.target.value }))}
                      />
                    </label>
                  )}

                  {/* Fila 6: Costos - 3 columnas */}
                  <div className="estado-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <label className="edit-modal-field">
                      <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Costo estimado - Mano de obra</span>
                      <input
                        type="number"
                        className="modal-control"
                        value={estadoForm.costoManoObra}
                        onChange={e => setEstadoForm(f => ({ ...f, costoManoObra: e.target.value }))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </label>

                    <label className="edit-modal-field">
                      <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Costo estimado - Repuestos</span>
                      <input
                        type="number"
                        className="modal-control"
                        value={estadoForm.costoRepuestos}
                        onChange={e => setEstadoForm(f => ({ ...f, costoRepuestos: e.target.value }))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </label>

                    <label className="edit-modal-field">
                      <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Costo total estimado</span>
                      <input
                        type="number"
                        className="modal-control"
                        value={estadoForm.costoTotal}
                        onChange={e => setEstadoForm(f => ({ ...f, costoTotal: e.target.value }))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </label>
                  </div>

                  {/* Fila 7: Evidencia - Full width */}
                  <label className="edit-modal-field">
                    <span style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>Evidencia (URL de imagen)</span>
                    <input
                      type="url"
                      className="modal-control"
                      value={estadoForm.evidenciaMantenimiento}
                      onChange={e => setEstadoForm(f => ({ ...f, evidenciaMantenimiento: e.target.value }))}
                      placeholder="https://ejemplo.com/foto.jpg"
                    />
                  </label>
                </>
              )}

              {estadoError && <div className="error-box">{estadoError}</div>}

              <div className="edit-modal-actions">
                <button type="submit" className="btn-primary edit-modal-save action-btn" disabled={estadoLoading} style={{ flex: 1, borderRadius: '10px' }}>
                  {estadoLoading ? 'Actualizando...' : 'Actualizar estado'}
                </button>
                <button type="button" className="btn-ghost edit-modal-cancel action-btn" onClick={closeEstadoModal} style={{ borderRadius: '10px' }}>
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
