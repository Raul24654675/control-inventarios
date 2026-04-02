export type Rol = 'ADMIN' | 'OPERADOR'
export type Sector = 'Electrica' | 'Neumatica' | 'Electronica'
export type Estado = 'Activo' | 'Inactivo' | 'EnMantenimiento'

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: Rol
  creadoEn: string
}

export interface Equipo {
  id: number
  nombre: string
  sector: Sector
  descripcion?: string
  estado: Estado
  ubicacion?: string
  creadoEn: string
  actualizadoEn: string
}

export interface HistorialEntry {
  id: number
  fecha: string
  accion: string
  campo: string
  equipo: {
    id: number
    nombre: string
    sector: string
    estado: string
    ubicacion?: string
  }
  realizadoPor: {
    id: number
    nombre: string
    email: string
    rol: string
  }
  cambios: {
    valorAnterior: unknown
    valorNuevo: unknown
  }
  resumen: string
}
