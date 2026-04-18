import { IsEnum, IsString, IsOptional, MinLength } from 'class-validator'
import type { MotivoInact, TiempoEstimado, AccionRequerida, Prioridad } from '@prisma/client'

export class UpdateEstadoEquipoDto {
  @IsEnum(['Activo', 'Inactivo', 'EnMantenimiento'])
  estado: 'Activo' | 'Inactivo' | 'EnMantenimiento'

  @IsOptional()
  @IsEnum([
    'FueraDeServicio',
    'SinUsoTemporal',
    'AveriaDetectada',
    'FaltaDeOperador',
    'Obsolescencia',
    'BajaAdministrativa',
    'EnEsperaDeRepuestos',
    'DesconectadoPorSeguridad',
  ])
  motivo?: MotivoInact

  @IsOptional()
  @IsString()
  @MinLength(10)
  descripcion?: string

  @IsOptional()
  @IsEnum(['Horas', 'Dias', 'Indefinido'])
  tiempoEstimado?: TiempoEstimado

  @IsOptional()
  @IsEnum(['Inspeccion', 'Reparacion', 'Repuesto', 'Autorizacion', 'Reemplazo'])
  accionRequerida?: AccionRequerida

  @IsOptional()
  @IsEnum(['Baja', 'Media', 'Alta', 'Critica'])
  prioridad?: Prioridad

  @IsOptional()
  @IsString()
  evidenciaUrl?: string
}
