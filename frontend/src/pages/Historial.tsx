import { useEffect, useState } from 'react'
import api from '../api'
import type { HistorialEntry } from '../types'

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

  function accionBadge(accion: string) {
    const map: Record<string, React.CSSProperties> = {
      CREACION: { background: '#d4edda', color: '#1a5c2e' },
      ACTUALIZACION: { background: '#dbeafe', color: '#1e3a5f' },
      ELIMINACION: { background: '#fde8e3', color: '#b83c24' },
    }
    return {
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '.78rem',
      fontWeight: 700,
      ...(map[accion] ?? { background: '#f0ebe2', color: '#5f6b6d' }),
    } as React.CSSProperties
  }

  function formatCambios(cambios: HistorialEntry['cambios']) {
    const { valorAnterior, valorNuevo } = cambios
    if (valorAnterior === null && valorNuevo === null) return '—'
    if (typeof valorAnterior === 'object' && typeof valorNuevo === 'object') {
      return JSON.stringify(valorNuevo ?? {})
    }
    return `${String(valorAnterior ?? '—')} → ${String(valorNuevo ?? '—')}`
  }

  return (
    <div style={styles.page}>
      <div style={styles.toolbar}>
        <h2 style={{ margin: 0 }}>Historial de cambios</h2>
      </div>

      <div style={styles.filterBar}>
        <input
          type="number"
          min={1}
          placeholder="Filtrar por ID de equipo"
          value={equipoId}
          onChange={e => setEquipoId(e.target.value)}
          style={{ width: '240px' }}
        />
        <button className="btn-primary" onClick={() => load(equipoId || undefined)}>
          Filtrar
        </button>
        <button className="btn-ghost" onClick={() => { setEquipoId(''); load() }}>
          Ver todo
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div style={styles.tableWrap}>
        {loading ? (
          <p style={{ padding: '20px', color: 'var(--muted)' }}>Cargando...</p>
        ) : entries.length === 0 ? (
          <p style={{ padding: '20px', color: 'var(--muted)' }}>No hay registros de historial.</p>
        ) : (
          <table>
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
                  <td style={{ fontSize: '.84rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formatCambios(e.cambios)}
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
  filterBar: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '18px',
    background: '#fff',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
  },
  tableWrap: {
    background: '#fff',
    borderRadius: '14px',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },
}
