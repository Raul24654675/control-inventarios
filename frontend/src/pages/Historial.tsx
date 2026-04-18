import { useEffect, useState } from 'react'
import api from '../api'
import type { HistorialEntry } from '../types'
import './Historial.css'

export default function Historial() {
  const [entries, setEntries] = useState<HistorialEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [equipoId, setEquipoId] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [dateError, setDateError] = useState('')
  const [isClearingFilters, setIsClearingFilters] = useState(false)

  async function load(id?: string, desde?: string, hasta?: string) {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (id) params.set('equipoId', id)
      if (desde) params.set('fechaDesde', desde)
      if (hasta) params.set('fechaHasta', hasta)
      const query = params.toString()
      const url = query ? `/historial?${query}` : '/historial'
      const { data } = await api.get<HistorialEntry[]>(url)
      setEntries(data)
    } catch {
      setError('No se pudo cargar el historial.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function clearHistoryFilter() {
    setEquipoId('')
    setFechaDesde('')
    setFechaHasta('')
    setDateError('')
    load()
    setIsClearingFilters(true)
    setTimeout(() => setIsClearingFilters(false), 430)
  }

  function applyHistoryFilters() {
    setDateError('')
    if ((fechaDesde && !fechaHasta) || (!fechaDesde && fechaHasta)) {
      setDateError('Debe elegir fecha desde y fecha hasta para filtrar por rango.')
      return
    }
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      setDateError('La fecha desde debe ser anterior o igual a la fecha hasta.')
      return
    }

    load(equipoId || undefined, fechaDesde || undefined, fechaHasta || undefined)
  }

  function accionBadge(accion: string) {
    const map: Record<string, React.CSSProperties> = {
      CREACION: { background: 'rgba(34, 197, 94, 0.2)', color: '#30d37f' },
      ACTUALIZACION: { background: 'rgba(59, 130, 246, 0.22)', color: '#8ec8ff' },
      ELIMINACION: { background: 'rgba(248, 113, 113, 0.22)', color: '#ffa8a8' },
    }
    return {
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '.78rem',
      fontWeight: 700,
      ...(map[accion] ?? { background: 'rgba(148, 163, 184, 0.2)', color: 'var(--text-soft)' }),
    } as React.CSSProperties
  }

  function formatCambios(entry: HistorialEntry) {
    if (entry.accion === 'CREACION') return 'Equipo creado'
    if (entry.accion === 'ELIMINACION') return 'Equipo eliminado'

    const { valorAnterior, valorNuevo } = entry.cambios

    const toText = (value: unknown) => (value === null || value === undefined ? '—' : String(value))

    if (
      valorAnterior !== null &&
      valorNuevo !== null &&
      typeof valorAnterior === 'object' &&
      typeof valorNuevo === 'object'
    ) {
      const anteriorObj = valorAnterior as Record<string, unknown>
      const nuevoObj = valorNuevo as Record<string, unknown>
      const keys = Array.from(new Set([...Object.keys(anteriorObj), ...Object.keys(nuevoObj)]))

      if (keys.length === 0) return '—'

      return keys
        .map((key) => `${key}: ${toText(anteriorObj[key])} -> ${toText(nuevoObj[key])}`)
        .join('\n')
    }

    const anteriorTexto = toText(valorAnterior)
    const nuevoTexto = toText(valorNuevo)

    return `${anteriorTexto} -> ${nuevoTexto}`
  }

  return (
    <div style={styles.page}>
      <div style={styles.toolbar}>
        <h2 style={{ margin: 0 }}>Historial de cambios</h2>
      </div>

      <section className={`history-filters-card ${isClearingFilters ? 'is-clearing' : ''}`} aria-label="Filtros de historial">
        <h3 className="history-filters-title">FILTROS</h3>
        <div className="history-filters-divider" aria-hidden="true" />

        <div className="history-filters-grid">
          <label className="history-filter-item" htmlFor="history-filter-equipo-id">
            <span className="history-filter-label">ID DE EQUIPO</span>
            <input
              id="history-filter-equipo-id"
              className="history-filter-control"
              type="number"
              min={1}
              placeholder="Filtrar por ID de equipo"
              value={equipoId}
              onChange={e => setEquipoId(e.target.value)}
            />
          </label>

          <label className="history-filter-item" htmlFor="history-filter-fecha-desde">
            <span className="history-filter-label">FECHA DESDE</span>
            <input
              id="history-filter-fecha-desde"
              className="history-filter-control history-filter-date"
              type="date"
              value={fechaDesde}
              max={fechaHasta || undefined}
              onChange={e => setFechaDesde(e.target.value)}
            />
          </label>

          <label className="history-filter-item" htmlFor="history-filter-fecha-hasta">
            <span className="history-filter-label">FECHA HASTA</span>
            <input
              id="history-filter-fecha-hasta"
              className="history-filter-control history-filter-date"
              type="date"
              value={fechaHasta}
              min={fechaDesde || undefined}
              onChange={e => setFechaHasta(e.target.value)}
            />
          </label>
        </div>

        {dateError && <div className="error-box" style={{ marginTop: '10px' }}>{dateError}</div>}

        <div className="history-filters-divider" aria-hidden="true" />
        <div className="history-filters-actions">
          <button className="btn-primary" onClick={applyHistoryFilters}>
            Filtrar
          </button>
          <button className="btn-ghost" onClick={clearHistoryFilter}>
            Ver todo
          </button>
        </div>
      </section>

      {error && <div className="error-box">{error}</div>}

      <div style={styles.tableWrap}>
        {loading ? (
          <p style={{ padding: '20px', color: 'var(--muted)' }}>Cargando...</p>
        ) : entries.length === 0 ? (
          <p style={{ padding: '20px', color: 'var(--muted)' }}>historial vacio</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Acción</th>
                <th>Equipo</th>
                <th>Campo</th>
                <th>Cambio</th>
                <th>Realizado por</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td style={{ fontSize: '.82rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {new Date(e.fecha).toLocaleString('es-ES')}
                  </td>
                  <td><span style={accionBadge(e.accion)}>{e.accion}</span></td>
                  <td style={{ fontWeight: 600 }}>{e.equipo.nombre}</td>
                  <td style={{ fontSize: '.88rem', color: 'var(--muted)' }}>{e.campo}</td>
                  <td style={{ fontSize: '.84rem', maxWidth: '320px', whiteSpace: 'pre-line' }}>
                    {formatCambios(e)}
                  </td>
                  <td style={{ fontSize: '.85rem' }}>
                    <div style={{ fontWeight: 600 }}>{e.realizadoPor.nombre}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '.8rem' }}>{e.realizadoPor.rol}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '28px', maxWidth: '1300px', margin: '0 auto' },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' },
  tableWrap: {
    background: 'var(--surface)',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-soft)',
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
    maxWidth: '420px',
    border: '1px solid var(--border)',
    boxShadow: '0 18px 40px rgba(20,30,32,.25)',
  },
  modalActions: {
    marginTop: '14px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
}
