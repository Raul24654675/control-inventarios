import { useEffect, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import api from '../api'
import type { HistorialEntry } from '../types'
import 'react-day-picker/style.css'
import './Historial.css'

// ── Label maps ──────────────────────────────────────────────────────────────

const MOTIVO_INACT: Record<string, string> = {
  FueraDeServicio: 'Fuera de servicio',
  SinUsoTemporal: 'Sin uso temporal',
  AveriaDetectada: 'Avería detectada',
  FaltaDeOperador: 'Falta de operador',
  Obsolescencia: 'Obsolescencia',
  BajaAdministrativa: 'Baja administrativa',
  EnEsperaDeRepuestos: 'En espera de repuestos',
  DesconectadoPorSeguridad: 'Desconectado por seguridad',
}

const TIEMPO_ESTIMADO: Record<string, string> = {
  Horas: 'Horas',
  Dias: 'Días',
  Indefinido: 'Indefinido',
}

const ACCION_REQUERIDA: Record<string, string> = {
  Inspeccion: 'Inspección',
  Reparacion: 'Reparación',
  Repuesto: 'Repuesto',
  Autorizacion: 'Autorización',
  Reemplazo: 'Reemplazo',
}

const PRIORIDAD: Record<string, string> = {
  Baja: 'Baja',
  Media: 'Media',
  Alta: 'Alta',
  Critica: 'Crítica',
}

const TIPO_MANT: Record<string, string> = {
  Preventivo: 'Preventivo',
  Correctivo: 'Correctivo',
  Predictivo: 'Predictivo',
  Calibracion: 'Calibración',
  LimpiezaTecnica: 'Limpieza técnica',
  RevisionGeneral: 'Revisión general',
  SustitucionPiezas: 'Sustitución de piezas',
}

const MOTIVO_MANT: Record<string, string> = {
  FalloDetectado: 'Fallo detectado',
  ProgramacionPeriodica: 'Programación periódica',
  Desgaste: 'Desgaste',
  RuidoAnormal: 'Ruido anormal',
  BajoRendimiento: 'Bajo rendimiento',
  ErrorSistema: 'Error del sistema',
  InspeccionObligatoria: 'Inspección obligatoria',
}

const MOTIVO_REACT: Record<string, string> = {
  ReincorporacionServicio: 'Reincorporación al servicio',
  NuevaAsignacion: 'Nueva asignación',
  ReactivacionProgramada: 'Reactivación programada',
  DisponibilidadRequerida: 'Disponibilidad requerida',
  AutorizacionAdministrativa: 'Autorización administrativa',
}

const RESULTADO_MANT: Record<string, string> = {
  Reparado: 'Reparado',
  Ajustado: 'Ajustado',
  Calibrado: 'Calibrado',
  LimpiezaCompletada: 'Limpieza completada',
}

const PRUEBA_LABEL: Record<string, string> = {
  Encendido: 'Encendido',
  Diagnostico: 'Diagnóstico',
  PruebaFuncional: 'Prueba funcional',
  ValidacionTecnica: 'Validación técnica',
}

const CONDICION_LABEL: Record<string, string> = {
  OperativoNormal: 'Operativo normal',
  OperativoConObservacion: 'Operativo con observación',
}

const lbl = (map: Record<string, string>, key: string | null | undefined) =>
  key ? (map[key] ?? key) : '—'

const ACCION_OPTIONS = ['CREACION', 'ACTUALIZACION', 'ELIMINACION'] as const

const CAMBIO_OPTIONS = [
  'Mantenimiento -> Inactivo',
  'Mantenimiento -> Activo',
  'Inactivo -> En mantenimiento',
  'Inactivo -> Activo',
  'Activo -> Inactivo',
  'Activo -> En mantenimiento',
] as const

function parseIsoDate(value: string) {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toDisplayDate(value: string) {
  const date = parseIsoDate(value)
  if (!date) return 'dd/mm/aaaa'
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Read-only field helper ───────────────────────────────────────────────────

function ROField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="hd-field">
      <span className="hd-field-label">{label}</span>
      <span className="hd-field-value">{value || '—'}</span>
    </div>
  )
}

function RORow({ children }: { children: React.ReactNode }) {
  return <div className="hd-row">{children}</div>
}

function HDivider({ title }: { title: string }) {
  return <div className="hd-section-title">{title}</div>
}

// ── Detail panels ────────────────────────────────────────────────────────────

function DetailInactivo({ d }: { d: Record<string, unknown> }) {
  return (
    <>
      <HDivider title="Detalles de inactividad" />
      <RORow>
        <ROField label="Motivo" value={lbl(MOTIVO_INACT, d.motivo as string)} />
        <ROField label="Prioridad" value={lbl(PRIORIDAD, d.prioridad as string)} />
      </RORow>
      <ROField label="Descripción detallada" value={d.descripcion as string} />
      <RORow>
        <ROField label="Tiempo estimado" value={lbl(TIEMPO_ESTIMADO, d.tiempoEstimado as string)} />
        <ROField label="Acción requerida" value={lbl(ACCION_REQUERIDA, d.accionRequerida as string)} />
      </RORow>
      {d.evidenciaUrl && <ROField label="Evidencia (URL)" value={d.evidenciaUrl as string} />}
    </>
  )
}

function DetailMantenimiento({ d }: { d: Record<string, unknown> }) {
  return (
    <>
      <HDivider title="Detalles del mantenimiento" />
      <RORow>
        <ROField label="Tipo de mantenimiento" value={lbl(TIPO_MANT, d.tipoMantenimiento as string)} />
        <ROField label="Motivo" value={lbl(MOTIVO_MANT, d.motivoMantenimiento as string)} />
      </RORow>
      <RORow>
        <ROField label="Fecha de inicio" value={d.fechaInicio as string} />
        <ROField label="Hora de inicio" value={d.horaInicio as string} />
      </RORow>
      <ROField label="Descripción técnica" value={d.descripcionTecnica as string} />
      <RORow>
        <ROField label="Fecha estimada de finalización" value={d.fechaFinEstimada as string} />
        <ROField label="Prioridad" value={lbl(PRIORIDAD, d.prioridadMantenimiento as string)} />
      </RORow>
      <RORow>
        <ROField label="Costo mano de obra (COP)" value={d.costoManoObra as string} />
        <ROField label="Costo repuestos (COP)" value={d.costoRepuestos as string} />
        <ROField label="Costo total (COP)" value={d.costoTotal as string} />
      </RORow>
      {d.evidenciaMantenimiento && <ROField label="Evidencia (URL)" value={d.evidenciaMantenimiento as string} />}
    </>
  )
}

function DetailActivoDesdeInactivo({ d }: { d: Record<string, unknown> }) {
  return (
    <>
      <HDivider title="Reactivación desde inactivo" />
      <ROField label="Motivo de reactivación" value={lbl(MOTIVO_REACT, d.motivoReactivacion as string)} />
      <ROField label="Justificación" value={d.justificacionReactivacion as string} />
      {d.observacionesReactivacion && (
        <ROField label="Observaciones" value={d.observacionesReactivacion as string} />
      )}
    </>
  )
}

function DetailActivoDesdeMantenimiento({ d }: { d: Record<string, unknown> }) {
  const pruebas = Array.isArray(d.pruebasRealizadas)
    ? (d.pruebasRealizadas as string[]).map(p => lbl(PRUEBA_LABEL, p)).join(', ')
    : '—'
  return (
    <>
      <HDivider title="Cierre de mantenimiento → Activo" />
      <RORow>
        <ROField label="Tipo de mantenimiento realizado" value={lbl(TIPO_MANT, d.tipoMantenimientoRealizado as string)} />
        <ROField label="Resultado" value={lbl(RESULTADO_MANT, d.resultadoMantenimiento as string)} />
      </RORow>
      <ROField label="Pruebas realizadas" value={pruebas} />
      <ROField label="Descripción técnica" value={d.descripcionReparacion as string} />
      <ROField label="Condición actual" value={lbl(CONDICION_LABEL, d.condicionActual as string)} />
    </>
  )
}

function EntryDetailModal({
  entry,
  onClose,
}: {
  entry: HistorialEntry
  onClose: () => void
}) {
  const nuevo = entry.cambios.valorNuevo
  const d = (typeof nuevo === 'object' && nuevo !== null ? nuevo : {}) as Record<string, unknown>
  const isRichDetail = typeof nuevo === 'object' && nuevo !== null && 'estado' in d

  const estado = (d.estado as string) ?? (typeof nuevo === 'string' ? nuevo : '—')
  const estadoPrevio = d.estadoPrevio as string | undefined

  function renderDetail() {
    if (!isRichDetail) {
      return (
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '8px' }}>
          Este registro fue creado antes de que se almacenara el detalle completo.
        </p>
      )
    }

    if (estado === 'Inactivo') return <DetailInactivo d={d} />
    if (estado === 'EnMantenimiento') return <DetailMantenimiento d={d} />
    if (estado === 'Activo' && estadoPrevio === 'Inactivo') return <DetailActivoDesdeInactivo d={d} />
    if (estado === 'Activo' && estadoPrevio === 'EnMantenimiento') return <DetailActivoDesdeMantenimiento d={d} />
    return <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '8px' }}>Sin detalle adicional.</p>
  }

  const estadoLabel: Record<string, string> = {
    Activo: 'Activo',
    Inactivo: 'Inactivo',
    EnMantenimiento: 'En mantenimiento',
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        className="hd-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="hd-modal-header">
          <div>
            <div className="hd-modal-title">Detalle del cambio</div>
            <div className="hd-modal-sub">
              <strong>{entry.equipo.nombre}</strong> &nbsp;·&nbsp;
              {new Date(entry.fecha).toLocaleString('es-ES')}
            </div>
          </div>
          <button className="hd-close-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="hd-transition-row">
          <span className="hd-chip hd-chip-from">
            {estadoLabel[entry.cambios.valorAnterior as string] ?? (typeof entry.cambios.valorAnterior === 'object' ? estadoLabel[(entry.cambios.valorAnterior as any)?.estado] ?? '—' : String(entry.cambios.valorAnterior ?? '—') )}
          </span>
          <span className="hd-arrow">→</span>
          <span className="hd-chip hd-chip-to">{estadoLabel[estado] ?? estado}</span>
        </div>

        <div className="hd-detail-body">
          {renderDetail()}
        </div>

        <div className="hd-modal-footer">
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
            Realizado por <strong>{entry.realizadoPor.nombre}</strong> ({entry.realizadoPor.rol})
          </span>
          <button className="btn-ghost" style={{ borderRadius: '8px', padding: '6px 18px' }} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

// ── Main component ───────────────────────────────────────────────────────────

export default function Historial() {
  const [entries, setEntries] = useState<HistorialEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [equipo, setEquipo] = useState('')
  const [realizadoPor, setRealizadoPor] = useState('')
  const [accion, setAccion] = useState('')
  const [cambio, setCambio] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [dateError, setDateError] = useState('')
  const [openDatePicker, setOpenDatePicker] = useState<'fechaDesde' | 'fechaHasta' | null>(null)
  const [isClearingFilters, setIsClearingFilters] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<HistorialEntry | null>(null)

  async function load(filters?: {
    equipo?: string
    realizadoPor?: string
    accion?: string
    cambio?: string
    fechaDesde?: string
    fechaHasta?: string
  }) {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filters?.equipo) params.set('equipo', filters.equipo)
      if (filters?.realizadoPor) params.set('realizadoPor', filters.realizadoPor)
      if (filters?.accion) params.set('accion', filters.accion)
      if (filters?.cambio) params.set('cambio', filters.cambio)
      if (filters?.fechaDesde) params.set('fechaDesde', filters.fechaDesde)
      if (filters?.fechaHasta) params.set('fechaHasta', filters.fechaHasta)
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

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('.custom-date-picker')) {
        setOpenDatePicker(null)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  function clearHistoryFilter() {
    setEquipo('')
    setRealizadoPor('')
    setAccion('')
    setCambio('')
    setFechaDesde('')
    setFechaHasta('')
    setOpenDatePicker(null)
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

    load({
      equipo: equipo || undefined,
      realizadoPor: realizadoPor || undefined,
      accion: accion || undefined,
      cambio: cambio || undefined,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
    })
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

    const getEstadoRaw = (value: unknown): string | null => {
      if (typeof value === 'string') return value
      if (value && typeof value === 'object') {
        const estadoObj = (value as Record<string, unknown>).estado
        return typeof estadoObj === 'string' ? estadoObj : null
      }
      return null
    }

    const normalizeEstado = (value: string | null): 'Activo' | 'Inactivo' | 'EnMantenimiento' | null => {
      if (!value) return null
      const compact = value.replace(/\s+/g, '').toLowerCase()
      if (compact === 'activo') return 'Activo'
      if (compact === 'inactivo') return 'Inactivo'
      if (compact === 'enmantenimiento' || compact === 'mantenimiento') return 'EnMantenimiento'
      return null
    }

    if (entry.campo.toLowerCase() === 'estado') {
      const estadoAnterior = normalizeEstado(getEstadoRaw(valorAnterior))
      const estadoNuevo = normalizeEstado(getEstadoRaw(valorNuevo))

      if (estadoAnterior && estadoNuevo && estadoAnterior !== estadoNuevo) {
        const fromLabel: Record<'Activo' | 'Inactivo' | 'EnMantenimiento', string> = {
          Activo: 'Activo',
          Inactivo: 'Inactivo',
          EnMantenimiento: 'Mantenimiento',
        }
        const toLabel: Record<'Activo' | 'Inactivo' | 'EnMantenimiento', string> = {
          Activo: 'Activo',
          Inactivo: 'Inactivo',
          EnMantenimiento: 'En mantenimiento',
        }
        return `${fromLabel[estadoAnterior]} -> ${toLabel[estadoNuevo]}`
      }
    }

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
          <label className="history-filter-item" htmlFor="history-filter-equipo">
            <span className="history-filter-label">EQUIPO</span>
            <input
              id="history-filter-equipo"
              className="history-filter-control"
              type="text"
              placeholder="Nombre o ID del equipo"
              value={equipo}
              onChange={e => setEquipo(e.target.value)}
            />
          </label>

          <label className="history-filter-item" htmlFor="history-filter-realizado-por">
            <span className="history-filter-label">REALIZADO POR</span>
            <input
              id="history-filter-realizado-por"
              className="history-filter-control"
              type="text"
              placeholder="Nombre de usuario"
              value={realizadoPor}
              onChange={e => setRealizadoPor(e.target.value)}
            />
          </label>

          <label className="history-filter-item select-item" htmlFor="history-filter-accion">
            <span className="history-filter-label">ACCIÓN</span>
            <span className="history-select-wrap">
              <select
                id="history-filter-accion"
                className="history-filter-control"
                value={accion}
                onChange={e => setAccion(e.target.value)}
              >
                <option value="">Todas</option>
                {ACCION_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <span className="history-filter-chevron" aria-hidden="true" />
            </span>
          </label>

          <label className="history-filter-item select-item" htmlFor="history-filter-cambio">
            <span className="history-filter-label">CAMBIO</span>
            <span className="history-select-wrap">
              <select
                id="history-filter-cambio"
                className="history-filter-control"
                value={cambio}
                onChange={e => setCambio(e.target.value)}
              >
                <option value="">Todos</option>
                {CAMBIO_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <span className="history-filter-chevron" aria-hidden="true" />
            </span>
          </label>

          <label className="history-filter-item" htmlFor="history-filter-fecha-desde">
            <span className="history-filter-label">FECHA DESDE</span>
            <div className={`custom-date-picker ${openDatePicker === 'fechaDesde' ? 'is-open' : ''}`}>
              <button
                id="history-filter-fecha-desde"
                type="button"
                className="history-filter-control custom-date-trigger"
                onClick={() => setOpenDatePicker(current => current === 'fechaDesde' ? null : 'fechaDesde')}
                aria-label="Seleccionar fecha desde"
              >
                <span className={fechaDesde ? 'has-value' : 'is-placeholder'}>
                  {toDisplayDate(fechaDesde)}
                </span>
                <span className="custom-date-icon" aria-hidden="true" />
              </button>
              {openDatePicker === 'fechaDesde' && (
                <div className="custom-date-popover">
                  <DayPicker
                    mode="single"
                    locale={es}
                    captionLayout="dropdown"
                    fromYear={2000}
                    toYear={2100}
                    weekStartsOn={1}
                    showOutsideDays
                    toDate={parseIsoDate(fechaHasta)}
                    selected={parseIsoDate(fechaDesde)}
                    onSelect={(date) => {
                      if (!date) return
                      setFechaDesde(toIsoDate(date))
                      setOpenDatePicker(null)
                    }}
                  />
                  <div className="custom-date-actions">
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        setFechaDesde('')
                        setOpenDatePicker(null)
                      }}
                    >
                      Limpiar
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        setFechaDesde(toIsoDate(new Date()))
                        setOpenDatePicker(null)
                      }}
                    >
                      Hoy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </label>

          <label className="history-filter-item" htmlFor="history-filter-fecha-hasta">
            <span className="history-filter-label">FECHA HASTA</span>
            <div className={`custom-date-picker ${openDatePicker === 'fechaHasta' ? 'is-open' : ''}`}>
              <button
                id="history-filter-fecha-hasta"
                type="button"
                className="history-filter-control custom-date-trigger"
                onClick={() => setOpenDatePicker(current => current === 'fechaHasta' ? null : 'fechaHasta')}
                aria-label="Seleccionar fecha hasta"
              >
                <span className={fechaHasta ? 'has-value' : 'is-placeholder'}>
                  {toDisplayDate(fechaHasta)}
                </span>
                <span className="custom-date-icon" aria-hidden="true" />
              </button>
              {openDatePicker === 'fechaHasta' && (
                <div className="custom-date-popover">
                  <DayPicker
                    mode="single"
                    locale={es}
                    captionLayout="dropdown"
                    fromYear={2000}
                    toYear={2100}
                    weekStartsOn={1}
                    showOutsideDays
                    fromDate={parseIsoDate(fechaDesde)}
                    selected={parseIsoDate(fechaHasta)}
                    onSelect={(date) => {
                      if (!date) return
                      setFechaHasta(toIsoDate(date))
                      setOpenDatePicker(null)
                    }}
                  />
                  <div className="custom-date-actions">
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        setFechaHasta('')
                        setOpenDatePicker(null)
                      }}
                    >
                      Limpiar
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        setFechaHasta(toIsoDate(new Date()))
                        setOpenDatePicker(null)
                      }}
                    >
                      Hoy
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                <th style={{ width: '48px' }}></th>
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
                  <td>
                    {e.campo === 'estado' && (
                      <button
                        className="hd-detail-btn"
                        onClick={() => setSelectedEntry(e)}
                        title="Ver detalle"
                        aria-label="Ver detalle del cambio"
                      >
                        ···
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedEntry && (
        <EntryDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
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
