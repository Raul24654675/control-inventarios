import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import type { Equipo, Estado, HistorialEntry, Sector } from '../types'
import { useAuth } from '../useAuth'
import './Resumen.css'

type GroupStat = {
  key: string
  label: string
  count: number
  percent: number
  color: string
}

const CATEGORY_META: Record<Sector, { label: string; color: string }> = {
  Electrica: { label: 'Electrica', color: '#22c58b' },
  Neumatica: { label: 'Neumatica', color: '#38bdf8' },
  Electronica: { label: 'Electronica', color: '#f59e0b' },
}

const STATUS_META: Record<Estado, { label: string; color: string }> = {
  Activo: { label: 'Activo', color: '#22c58b' },
  Inactivo: { label: 'Inactivo', color: '#f87171' },
  EnMantenimiento: { label: 'En mantenimiento', color: '#fbbf24' },
}

function toPercent(count: number, total: number) {
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}

function isToday(dateIso: string) {
  const now = new Date()
  const current = new Date(dateIso)
  return now.getFullYear() === current.getFullYear() && now.getMonth() === current.getMonth() && now.getDate() === current.getDate()
}

function daysAgoDate(days: number) {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  base.setDate(base.getDate() - days)
  return base
}

export default function Resumen() {
  const navigate = useNavigate()
  const { email, rol } = useAuth()
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [historial, setHistorial] = useState<HistorialEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isClosingDeleteModal, setIsClosingDeleteModal] = useState(false)
  const [deleteFilters, setDeleteFilters] = useState({ id: '', nombre: '', sector: '', estado: '' })
  const [deletePage, setDeletePage] = useState(1)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<{ id: number; nombre: string } | null>(null)
  const [deleteTableMotionKey, setDeleteTableMotionKey] = useState(0)

  const deletePageSize = 5

  useEffect(() => {
    async function loadResumen() {
      setLoading(true)
      setError('')

      try {
        const [equiposRes, historialRes] = await Promise.all([
          api.get<Equipo[]>('/equipos?page=1&limit=500'),
          api.get<HistorialEntry[]>('/historial'),
        ])

        setEquipos(equiposRes.data)
        setHistorial(historialRes.data)
      } catch {
        setError('No se pudo cargar la informacion general de equipos.')
      } finally {
        setLoading(false)
      }
    }

    loadResumen()
  }, [])

  const totalEquipos = equipos.length

  const categoryStats = useMemo<GroupStat[]>(() => {
    const grouped: Record<Sector, number> = {
      Electrica: 0,
      Neumatica: 0,
      Electronica: 0,
    }

    for (const item of equipos) {
      grouped[item.sector] += 1
    }

    return (Object.keys(grouped) as Sector[])
      .map((key) => ({
        key,
        label: CATEGORY_META[key].label,
        count: grouped[key],
        percent: toPercent(grouped[key], totalEquipos),
        color: CATEGORY_META[key].color,
      }))
      .sort((a, b) => b.count - a.count)
  }, [equipos, totalEquipos])

  const statusStats = useMemo<GroupStat[]>(() => {
    const grouped: Record<Estado, number> = {
      Activo: 0,
      Inactivo: 0,
      EnMantenimiento: 0,
    }

    for (const item of equipos) {
      grouped[item.estado] += 1
    }

    return (Object.keys(grouped) as Estado[]).map((key) => ({
      key,
      label: STATUS_META[key].label,
      count: grouped[key],
      percent: toPercent(grouped[key], totalEquipos),
      color: STATUS_META[key].color,
    }))
  }, [equipos, totalEquipos])

  const statusConic = useMemo(() => {
    let cursor = 0
    const segments = statusStats.map((item) => {
      const start = cursor
      cursor += item.percent
      return `${item.color} ${start}% ${cursor}%`
    })

    if (cursor < 100) {
      segments.push(`color-mix(in srgb, var(--surface-soft) 76%, #94a3b8) ${cursor}% 100%`)
    }

    return `conic-gradient(from 210deg, ${segments.join(', ')})`
  }, [statusStats])

  const maxCategory = Math.max(...categoryStats.map(item => item.count), 1)

  const kpiData = useMemo(() => {
    const activos = statusStats.find(item => item.key === 'Activo')?.count ?? 0
    const inactivos = statusStats.find(item => item.key === 'Inactivo')?.count ?? 0
    const enMantenimiento = statusStats.find(item => item.key === 'EnMantenimiento')?.count ?? 0
    const conUbicacion = equipos.filter(item => (item.ubicacion ?? '').trim() !== '').length
    const cambiosHoy = historial.filter(item => isToday(item.fecha)).length

    return {
      activos,
      inactivos,
      enMantenimiento,
      conUbicacion,
      cambiosHoy,
      activosPercent: toPercent(activos, totalEquipos),
      inactivosPercent: toPercent(inactivos, totalEquipos),
      mantenimientoPercent: toPercent(enMantenimiento, totalEquipos),
    }
  }, [equipos, historial, statusStats, totalEquipos])

  const activityTrend = useMemo(() => {
    const days = 7
    const points: Array<{ label: string; total: number; creacion: number; actualizacion: number; eliminacion: number }> = []

    for (let i = days - 1; i >= 0; i -= 1) {
      const date = daysAgoDate(i)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayRecords = historial.filter(item => {
        const d = new Date(item.fecha)
        return d >= date && d < nextDate
      })

      points.push({
        label: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        total: dayRecords.length,
        creacion: dayRecords.filter(item => item.accion === 'CREACION').length,
        actualizacion: dayRecords.filter(item => item.accion === 'ACTUALIZACION').length,
        eliminacion: dayRecords.filter(item => item.accion === 'ELIMINACION').length,
      })
    }

    return points
  }, [historial])

  const maxTrend = Math.max(...activityTrend.map(item => item.total), 1)

  const topIntervenidos = useMemo(() => {
    const grouped = new Map<string, number>()
    for (const item of historial) {
      const key = item.equipo?.nombre ?? 'Equipo no identificado'
      grouped.set(key, (grouped.get(key) ?? 0) + 1)
    }

    return Array.from(grouped.entries())
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [historial])

  const maxTopIntervenido = Math.max(...topIntervenidos.map(item => item.total), 1)

  const matrixData = useMemo(() => {
    const initial: Record<Sector, Record<Estado, number>> = {
      Electrica: { Activo: 0, Inactivo: 0, EnMantenimiento: 0 },
      Neumatica: { Activo: 0, Inactivo: 0, EnMantenimiento: 0 },
      Electronica: { Activo: 0, Inactivo: 0, EnMantenimiento: 0 },
    }

    for (const item of equipos) {
      initial[item.sector][item.estado] += 1
    }

    return initial
  }, [equipos])

  const userActivity = useMemo(() => {
    if (!email) return []
    const lower = email.toLowerCase()
    return historial
      .filter(item => (item.realizadoPor.email ?? '').toLowerCase() === lower)
      .slice(0, 6)
  }, [email, historial])

  const userActivityToday = userActivity.filter(item => isToday(item.fecha)).length

  const quickAlerts = useMemo(() => {
    const inactivos = equipos
      .filter(item => item.estado === 'Inactivo')
      .slice(0, 3)
      .map(item => ({
        id: `in-${item.id}`,
        tipo: 'Inactivo',
        detalle: `${item.nombre} se encuentra inactivo.`,
      }))

    const mantenimientoAntiguo = equipos
      .filter(item => item.estado === 'EnMantenimiento')
      .sort((a, b) => new Date(a.actualizadoEn).getTime() - new Date(b.actualizadoEn).getTime())
      .slice(0, 3)
      .map(item => ({
        id: `mt-${item.id}`,
        tipo: 'Mantenimiento',
        detalle: `${item.nombre} lleva mas tiempo sin actualizarse.`,
      }))

    const sinUbicacion = equipos
      .filter(item => (item.ubicacion ?? '').trim() === '')
      .slice(0, 3)
      .map(item => ({
        id: `ub-${item.id}`,
        tipo: 'Sin ubicacion',
        detalle: `${item.nombre} no tiene ubicacion definida.`,
      }))

    return [...inactivos, ...mantenimientoAntiguo, ...sinUbicacion].slice(0, 8)
  }, [equipos])

  const filteredEquiposToDelete = useMemo(() => {
    const idFilter = deleteFilters.id.trim()
    const nameFilter = deleteFilters.nombre.trim().toLowerCase()

    return equipos
      .filter(item => {
        if (idFilter && !String(item.id).includes(idFilter)) return false
        if (nameFilter && !item.nombre.toLowerCase().includes(nameFilter)) return false
        if (deleteFilters.sector && item.sector !== deleteFilters.sector) return false
        if (deleteFilters.estado && item.estado !== deleteFilters.estado) return false
        return true
      })
  }, [deleteFilters.estado, deleteFilters.id, deleteFilters.nombre, deleteFilters.sector, equipos])

  const deleteTotalPages = Math.max(1, Math.ceil(filteredEquiposToDelete.length / deletePageSize))

  const equiposToDelete = useMemo(() => {
    const start = (deletePage - 1) * deletePageSize
    return filteredEquiposToDelete.slice(start, start + deletePageSize)
  }, [deletePage, filteredEquiposToDelete])

  useEffect(() => {
    if (!showDeleteModal) return
    setDeletePage(1)
    setDeleteTableMotionKey(current => current + 1)
  }, [deleteFilters.estado, deleteFilters.id, deleteFilters.nombre, deleteFilters.sector, showDeleteModal])

  useEffect(() => {
    if (deletePage > deleteTotalPages) {
      setDeletePage(deleteTotalPages)
    }
  }, [deletePage, deleteTotalPages])

  function openDeleteModal() {
    setDeleteError('')
    setDeleteFilters({ id: '', nombre: '', sector: '', estado: '' })
    setDeletePage(1)
    setPendingDelete(null)
    setIsClosingDeleteModal(false)
    setShowDeleteModal(true)
  }

  function closeDeleteModal() {
    if (isClosingDeleteModal) return
    setIsClosingDeleteModal(true)
    setTimeout(() => {
      setShowDeleteModal(false)
      setIsClosingDeleteModal(false)
      setPendingDelete(null)
    }, 300)
  }

  function askDeleteEquipo(id: number, nombre: string) {
    setPendingDelete({ id, nombre })
  }

  async function confirmDeleteEquipo() {
    if (!pendingDelete) return

    setDeletingId(pendingDelete.id)
    setDeleteError('')

    try {
      await api.delete(`/equipos/${pendingDelete.id}`)
      setEquipos(current => current.filter(item => item.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setDeleteError(msg ?? 'No se pudo eliminar el equipo seleccionado.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="resumen-page">
      <section className="resumen-actions-top" aria-label="Acciones rapidas de resumen">
        <div className="resumen-actions-head">
          <h2>Acciones rapidas</h2>
          <p>Atajos directos para que al entrar al resumen puedas operar sin buscar en otras secciones.</p>
        </div>

        <div className="resumen-actions-grid">
          <button
            type="button"
            className="resumen-action-btn is-primary"
            onClick={() => navigate(rol === 'ADMIN' ? '/equipos?createEquipo=1' : '/equipos')}
          >
            <span className="resumen-action-icon" aria-hidden="true">+</span>
            <span>
              <strong>Registrar equipo</strong>
              <small>Agrega un nuevo equipo al inventario</small>
            </span>
          </button>

          <button
            type="button"
            className="resumen-action-btn"
            onClick={openDeleteModal}
          >
            <span className="resumen-action-icon" aria-hidden="true">-</span>
            <span>
              <strong>Eliminar equipo</strong>
              <small>Buscar y eliminar desde modal flotante</small>
            </span>
          </button>

          <button type="button" className="resumen-action-btn" onClick={() => navigate('/equipos')}>
            <span className="resumen-action-icon" aria-hidden="true">#</span>
            <span>
              <strong>Gestionar equipos</strong>
              <small>Consultar, editar y filtrar</small>
            </span>
          </button>

          <button type="button" className="resumen-action-btn" onClick={() => navigate('/historial')}>
            <span className="resumen-action-icon" aria-hidden="true">@</span>
            <span>
              <strong>Ver historial</strong>
              <small>Auditar cambios recientes</small>
            </span>
          </button>

          {rol === 'ADMIN' && (
            <button type="button" className="resumen-action-btn is-accent" onClick={() => navigate('/usuarios')}>
              <span className="resumen-action-icon" aria-hidden="true">*</span>
              <span>
                <strong>Administrar usuarios</strong>
                <small>Gestiona operadores y permisos</small>
              </span>
            </button>
          )}
        </div>
      </section>

      <section className="resumen-head">
        <div>
          <span className="resumen-kicker">Resumen</span>
          <h1>Informacion general de equipos</h1>
          <p>Visualizacion consolidada del inventario con graficas detalladas por categoria y estado.</p>
        </div>
        <div className="resumen-total-card">
          <span>Total equipos</span>
          <strong>{totalEquipos}</strong>
        </div>
      </section>

      {error && <div className="error-box">{error}</div>}
      {loading && <div className="resumen-loading">Cargando datos...</div>}

      <section className="resumen-kpi-grid">
        <article className="resumen-kpi-card">
          <span>Activos</span>
          <strong>{kpiData.activos}</strong>
          <small>{kpiData.activosPercent}% del total</small>
        </article>
        <article className="resumen-kpi-card">
          <span>Inactivos</span>
          <strong>{kpiData.inactivos}</strong>
          <small>{kpiData.inactivosPercent}% del total</small>
        </article>
        <article className="resumen-kpi-card">
          <span>En mantenimiento</span>
          <strong>{kpiData.enMantenimiento}</strong>
          <small>{kpiData.mantenimientoPercent}% del total</small>
        </article>
        <article className="resumen-kpi-card">
          <span>Con ubicacion</span>
          <strong>{kpiData.conUbicacion}</strong>
          <small>{toPercent(kpiData.conUbicacion, totalEquipos)}% del total</small>
        </article>
        <article className="resumen-kpi-card">
          <span>Cambios hoy</span>
          <strong>{kpiData.cambiosHoy}</strong>
          <small>Desde historial de movimientos</small>
        </article>
      </section>

      <section className="resumen-grid">
        <article className="resumen-card">
          <div className="resumen-card-head">
            <h3>Cantidad de equipos por categoria</h3>
            <span>Distribucion por sector tecnico</span>
          </div>

          <div className="resumen-bars">
            {categoryStats.map((item) => (
              <div className="resumen-bar-row" key={item.key}>
                <div className="resumen-bar-labels">
                  <strong>{item.label}</strong>
                  <span>{item.count} equipos ({item.percent}%)</span>
                </div>
                <div className="resumen-bar-track">
                  <div
                    className="resumen-bar-fill"
                    style={{
                      width: `${Math.round((item.count / maxCategory) * 100)}%`,
                      background: `linear-gradient(90deg, ${item.color}, color-mix(in srgb, ${item.color} 78%, #ffffff))`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="resumen-card">
          <div className="resumen-card-head">
            <h3>Estado de los equipos</h3>
            <span>Activo, inactivo y en mantenimiento</span>
          </div>

          <div className="resumen-status-wrap">
            <div className="resumen-donut" style={{ background: statusConic }} aria-hidden="true">
              <div className="resumen-donut-center">
                <strong>{totalEquipos}</strong>
                <span>Equipos</span>
              </div>
            </div>

            <div className="resumen-legend">
              {statusStats.map((item) => (
                <div className="resumen-legend-row" key={item.key}>
                  <span className="resumen-dot" style={{ background: item.color }} />
                  <span className="resumen-legend-label">{item.label}</span>
                  <strong>{item.count}</strong>
                  <span className="resumen-legend-percent">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="resumen-grid-reserved">
        <article className="resumen-card">
          <div className="resumen-card-head">
            <h3>Tendencia semanal de actividad</h3>
            <span>Ultimos 7 dias (creacion, actualizacion, eliminacion)</span>
          </div>

          <div className="resumen-trend-list">
            {activityTrend.map(point => (
              <div className="resumen-trend-row" key={point.label}>
                <span className="resumen-trend-label">{point.label}</span>
                <div className="resumen-trend-track">
                  <div className="resumen-trend-fill" style={{ width: `${Math.round((point.total / maxTrend) * 100)}%` }} />
                </div>
                <span className="resumen-trend-total">{point.total}</span>
                <span className="resumen-trend-detail">C:{point.creacion} A:{point.actualizacion} E:{point.eliminacion}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="resumen-card">
          <div className="resumen-card-head">
            <h3>Top equipos mas intervenidos</h3>
            <span>Basado en cantidad de registros en historial</span>
          </div>

          <div className="resumen-top-list">
            {topIntervenidos.map(item => (
              <div className="resumen-top-row" key={item.nombre}>
                <span className="resumen-top-name">{item.nombre}</span>
                <div className="resumen-top-track">
                  <div className="resumen-top-fill" style={{ width: `${Math.round((item.total / maxTopIntervenido) * 100)}%` }} />
                </div>
                <strong>{item.total}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="resumen-grid-reserved">
        <article className="resumen-card">
          <div className="resumen-card-head">
            <h3>Mapa de estado por categoria</h3>
            <span>Matriz de lectura ejecutiva</span>
          </div>

          <div className="resumen-matrix-wrap">
            <table className="resumen-matrix">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Activo</th>
                  <th>Inactivo</th>
                  <th>En mantenimiento</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(matrixData) as Sector[]).map((sector) => (
                  <tr key={sector}>
                    <td>{CATEGORY_META[sector].label}</td>
                    <td>{matrixData[sector].Activo}</td>
                    <td>{matrixData[sector].Inactivo}</td>
                    <td>{matrixData[sector].EnMantenimiento}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="resumen-card">
          <div className="resumen-card-head">
            <h3>Actividad reciente del usuario</h3>
            <span>{email ?? 'Sin usuario'} - Hoy: {userActivityToday}</span>
          </div>

          <div className="resumen-user-activity-list">
            {userActivity.length === 0 ? (
              <p className="empty-state">No hay actividad reciente para este usuario.</p>
            ) : (
              userActivity.map(item => (
                <div className="resumen-user-activity-row" key={item.id}>
                  <span className={`resumen-user-badge badge-${item.accion.toLowerCase()}`}>{item.accion}</span>
                  <div>
                    <strong>{item.equipo.nombre}</strong>
                    <p>{new Date(item.fecha).toLocaleString('es-ES')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="resumen-alerts-card">
        <div className="resumen-card-head">
          <h3>Alertas rapidas</h3>
          <span>Inactivos, mantenimiento y ubicaciones pendientes</span>
        </div>

        <div className="resumen-alert-list">
          {quickAlerts.length === 0 ? (
            <p className="empty-state">No hay alertas activas.</p>
          ) : (
            quickAlerts.map(alert => (
              <div className="resumen-alert-row" key={alert.id}>
                <span>{alert.tipo}</span>
                <p>{alert.detalle}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {showDeleteModal && (
        <div className={`resumen-delete-overlay ${isClosingDeleteModal ? 'is-closing' : ''}`} onClick={closeDeleteModal}>
          <div className={`resumen-delete-card ${isClosingDeleteModal ? 'is-closing' : ''}`} onClick={(event) => event.stopPropagation()}>
            <div className="resumen-delete-head">
              <div>
                <h3>Eliminar equipo</h3>
                <p>Filtra y selecciona el equipo que deseas eliminar del inventario.</p>
              </div>
              <button type="button" className="btn-ghost resumen-delete-close-btn" onClick={closeDeleteModal}>
                Cerrar
              </button>
            </div>

            <div className="resumen-delete-filters">
              <label className="resumen-delete-filter-item">
                <span>ID</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 12"
                  value={deleteFilters.id}
                  onChange={event => setDeleteFilters(current => ({ ...current, id: event.target.value.replace(/\D/g, '') }))}
                />
              </label>

              <label className="resumen-delete-filter-item">
                <span>Nombre</span>
                <input
                  type="text"
                  placeholder="Buscar por nombre"
                  value={deleteFilters.nombre}
                  onChange={event => setDeleteFilters(current => ({ ...current, nombre: event.target.value }))}
                />
              </label>

              <label className="resumen-delete-filter-item">
                <span>Categoria</span>
                <select
                  value={deleteFilters.sector}
                  onChange={event => setDeleteFilters(current => ({ ...current, sector: event.target.value }))}
                >
                  <option value="">Todas</option>
                  <option value="Electrica">Electrica</option>
                  <option value="Neumatica">Neumatica</option>
                  <option value="Electronica">Electronica</option>
                </select>
              </label>

              <label className="resumen-delete-filter-item">
                <span>Estado</span>
                <select
                  value={deleteFilters.estado}
                  onChange={event => setDeleteFilters(current => ({ ...current, estado: event.target.value }))}
                >
                  <option value="">Todos</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="EnMantenimiento">En mantenimiento</option>
                </select>
              </label>
            </div>

            {deleteError && <div className="error-box">{deleteError}</div>}

            <div className="resumen-delete-table-wrap">
              <table className="resumen-delete-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Categoria</th>
                    <th>Estado</th>
                    <th>Accion</th>
                  </tr>
                </thead>
                <tbody key={deleteTableMotionKey}>
                  {equiposToDelete.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="resumen-delete-empty">No hay equipos que coincidan con los filtros.</td>
                    </tr>
                  ) : (
                    equiposToDelete.map((item, index) => (
                      <tr key={item.id} className="resumen-delete-row" style={{ animationDelay: `${index * 0.06}s` }}>
                        <td>{item.id}</td>
                        <td>{item.nombre}</td>
                        <td>{item.sector}</td>
                        <td>{item.estado === 'EnMantenimiento' ? 'En mantenimiento' : item.estado}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-danger equipos-delete-btn action-btn resumen-delete-btn"
                            disabled={deletingId === item.id || rol !== 'ADMIN'}
                            onClick={() => askDeleteEquipo(item.id, item.nombre)}
                          >
                            {deletingId === item.id ? 'Eliminando...' : 'Eliminar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="resumen-delete-pagination">
              <button
                type="button"
                className="btn-ghost"
                disabled={deletePage <= 1}
                onClick={() => setDeletePage(current => Math.max(1, current - 1))}
              >
                ← Anterior
              </button>
              <span className="resumen-delete-page-badge">Pagina {deletePage}</span>
              <button
                type="button"
                className="btn-ghost"
                disabled={deletePage >= deleteTotalPages || filteredEquiposToDelete.length === 0}
                onClick={() => setDeletePage(current => Math.min(deleteTotalPages, current + 1))}
              >
                Siguiente →
              </button>
            </div>

            {rol !== 'ADMIN' && <p className="resumen-delete-note">Solo un administrador puede eliminar equipos.</p>}
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="resumen-confirm-overlay" onClick={() => setPendingDelete(null)}>
          <div className="resumen-confirm-card" onClick={(event) => event.stopPropagation()}>
            <h4>Seguro que quiere eliminar el equipo?</h4>
            <p>Esta opcion no se puede deshacer.</p>
            <div className="resumen-confirm-actions">
              <button type="button" className="btn-ghost" onClick={() => setPendingDelete(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger equipos-delete-btn action-btn resumen-delete-btn"
                disabled={deletingId === pendingDelete.id}
                onClick={confirmDeleteEquipo}
              >
                {deletingId === pendingDelete.id ? 'Eliminando...' : `Eliminar ${pendingDelete.nombre}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
