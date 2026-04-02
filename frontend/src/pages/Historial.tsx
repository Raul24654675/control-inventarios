import { useEffect, useState } from 'react'
import api from '../api'
import type { HistorialEntry } from '../types'
import './Historial.css'

export default function Historial() {
  const [entries, setEntries] = useState<HistorialEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [equipoId, setEquipoId] = useState('')

  async function load(id?: string) {
    setLoading(true)
    setError('')
    try {
      const url = id ? `/historial?equipoId=${id}` : '/historial'
      const { data } = await api.get<HistorialEntry[]>(url)
      setEntries(data)
    } catch {
      setError('No se pudo cargar el historial.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function accionClass(accion: string) {
    if (accion === 'CREACION') return 'action-pill tag-activo'
    if (accion === 'ACTUALIZACION') return 'action-pill tag-neumatica'
    if (accion === 'ELIMINACION') return 'action-pill tag-mant'
    return 'action-pill tag-inactivo'
  }

  function formatCambios(cambios: HistorialEntry['cambios']) {
    const { valorAnterior, valorNuevo } = cambios
    if (valorAnterior === null && valorNuevo === null) return '---'
    if (typeof valorAnterior === 'object' && typeof valorNuevo === 'object') {
      return JSON.stringify(valorNuevo ?? {})
    }
    return `${String(valorAnterior ?? '---')} -> ${String(valorNuevo ?? '---')}`
  }

  return (
    <div>
      <div className="history-head">
        <div>
          <h2 className="history-title">Historial de cambios</h2>
          <p className="history-subtitle">Trazabilidad operativa por equipos y usuarios</p>
        </div>
      </div>

      <div className="history-filters">
        <input
          type="number"
          min={1}
          className="field-input"
          placeholder="Filtrar por ID de equipo"
          value={equipoId}
          onChange={e => setEquipoId(e.target.value)}
          style={{ width: '220px' }}
        />
        <button className="btn-primary" onClick={() => load(equipoId || undefined)}>
          Filtrar
        </button>
        <button className="btn-ghost" onClick={() => { setEquipoId(''); load() }}>
          Ver todo
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="history-table-card">
        {loading ? (
          <p className="empty-state">Cargando...</p>
        ) : entries.length === 0 ? (
          <p className="empty-state">No hay registros de historial.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Accion</th>
                <th>Equipo</th>
                <th>Campo</th>
                <th>Cambio</th>
                <th>Realizado por</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td className="muted-small" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(e.fecha).toLocaleString('es-ES')}
                  </td>
                  <td><span className={accionClass(e.accion)}>{e.accion}</span></td>
                  <td><strong>{e.equipo.nombre}</strong></td>
                  <td className="muted-small">{e.campo}</td>
                  <td className="muted-small" style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formatCambios(e.cambios)}
                  </td>
                  <td className="muted-small">
                    <div><strong>{e.realizadoPor.nombre}</strong></div>
                    <div>{e.realizadoPor.rol}</div>
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
