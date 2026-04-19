import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistorialService {
  constructor(private prisma: PrismaService) {}

  private normalizeEstado(value: unknown): 'Activo' | 'Inactivo' | 'EnMantenimiento' | null {
    if (typeof value !== 'string') return null;
    const compact = value.replace(/\s+/g, '').toLowerCase();
    if (compact === 'activo') return 'Activo';
    if (compact === 'inactivo') return 'Inactivo';
    if (compact === 'enmantenimiento' || compact === 'mantenimiento') return 'EnMantenimiento';
    return null;
  }

  private extractEstadoFromCambio(value: unknown): 'Activo' | 'Inactivo' | 'EnMantenimiento' | null {
    if (typeof value === 'string') return this.normalizeEstado(value);
    if (value && typeof value === 'object') {
      const estado = (value as Record<string, unknown>).estado;
      return this.normalizeEstado(estado);
    }
    return null;
  }

  private estadoTransitionLabel(entry: any): string | null {
    if (String(entry?.campo ?? '').toLowerCase() !== 'estado') return null;
    const anterior = this.extractEstadoFromCambio(entry?.cambios?.valorAnterior);
    const nuevo = this.extractEstadoFromCambio(entry?.cambios?.valorNuevo);
    if (!anterior || !nuevo || anterior === nuevo) return null;

    const fromLabel: Record<'Activo' | 'Inactivo' | 'EnMantenimiento', string> = {
      Activo: 'Activo',
      Inactivo: 'Inactivo',
      EnMantenimiento: 'Mantenimiento',
    };
    const toLabel: Record<'Activo' | 'Inactivo' | 'EnMantenimiento', string> = {
      Activo: 'Activo',
      Inactivo: 'Inactivo',
      EnMantenimiento: 'En mantenimiento',
    };

    return `${fromLabel[anterior]} -> ${toLabel[nuevo]}`;
  }

  private parseJsonSafe(value: string | null) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private normalizeAccion(campo: string) {
    const upper = campo.toUpperCase();
    if (upper === 'CREACION' || upper === 'CREACIÓN') return 'CREACION';
    if (upper === 'ELIMINACION' || upper === 'ELIMINACIÓN') return 'ELIMINACION';
    return 'ACTUALIZACION';
  }

  private extractEquipoFallback(anteriorRaw: any, nuevoRaw: any) {
    const anterior = anteriorRaw && typeof anteriorRaw === 'object' ? anteriorRaw : null;
    const nuevo = nuevoRaw && typeof nuevoRaw === 'object' ? nuevoRaw : null;
    const base = nuevo ?? anterior ?? {};

    return {
      id: typeof base.id === 'number' ? base.id : undefined,
      nombre: typeof base.nombre === 'string' ? base.nombre : undefined,
      sector: typeof base.sector === 'string' ? base.sector : undefined,
      estado: typeof base.estado === 'string' ? base.estado : undefined,
      ubicacion: typeof base.ubicacion === 'string' ? base.ubicacion : undefined,
    };
  }

  private mapEntry(item: any) {
    const accion = this.normalizeAccion(item.campo);
    const anteriorRaw = this.parseJsonSafe(item.valorAnterior);
    const nuevoRaw = this.parseJsonSafe(item.valorNuevo);
    const anterior = accion === 'CREACION' && anteriorRaw == null ? {} : anteriorRaw;
    const nuevo = accion === 'ELIMINACION' && nuevoRaw == null ? {} : nuevoRaw;
    const equipoFallback = this.extractEquipoFallback(anteriorRaw, nuevoRaw);

    return {
      id: item.id,
      fecha: item.fecha,
      accion,
      campo: item.campo,
      equipo: {
        id: item.equipo?.id ?? equipoFallback.id,
        nombre: item.equipo?.nombre ?? equipoFallback.nombre,
        sector: item.equipo?.sector ?? equipoFallback.sector,
        estado: item.equipo?.estado ?? equipoFallback.estado,
        ubicacion: item.equipo?.ubicacion ?? equipoFallback.ubicacion,
      },
      realizadoPor: {
        id: item.usuario?.id,
        nombre: item.usuario?.nombre,
        email: item.usuario?.email,
        rol: item.usuario?.rol,
      },
      cambios: {
        valorAnterior: anterior,
        valorNuevo: nuevo,
      },
      resumen: `${accion} por ${item.usuario?.nombre ?? 'usuario'} sobre ${item.equipo?.nombre ?? 'equipo'} en ${new Date(item.fecha).toISOString()}`,
    };
  }

  async findAll(filters?: {
    equipoId?: number;
    equipo?: string;
    realizadoPor?: string;
    accion?: string;
    cambio?: string;
    fechaDesde?: Date;
    fechaHasta?: Date;
  }) {
    const where: any = {}

    if (filters?.equipoId) {
      where.equipoId = filters.equipoId
    }

    if (filters?.equipo?.trim()) {
      const equipoFiltro = filters.equipo.trim();
      const maybeId = Number(equipoFiltro);
      const or: any[] = [
        {
          equipo: {
            is: {
              nombre: { contains: equipoFiltro, mode: 'insensitive' },
            },
          },
        },
      ];

      if (Number.isInteger(maybeId) && maybeId > 0) {
        or.push({ equipoId: maybeId });
      }

      where.AND = [...(where.AND ?? []), { OR: or }];
    }

    if (filters?.realizadoPor?.trim()) {
      where.usuario = {
        is: {
          nombre: { contains: filters.realizadoPor.trim(), mode: 'insensitive' },
        },
      };
    }

    if (filters?.fechaDesde && filters.fechaHasta) {
      const fechaDesde = new Date(filters.fechaDesde)
      fechaDesde.setHours(0, 0, 0, 0)
      const fechaHasta = new Date(filters.fechaHasta)
      fechaHasta.setHours(23, 59, 59, 999)
      where.fecha = {
        gte: fechaDesde,
        lte: fechaHasta,
      }
    }

    const data = await this.prisma.historialCambios.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        equipo: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
          },
        },
      },
    });

    let mapped = data.map((item) => this.mapEntry(item));

    if (filters?.accion?.trim()) {
      const accion = filters.accion.trim().toUpperCase();
      mapped = mapped.filter((entry) => entry.accion === accion);
    }

    if (filters?.cambio?.trim()) {
      const cambio = filters.cambio.trim();
      mapped = mapped.filter((entry) => this.estadoTransitionLabel(entry) === cambio);
    }

    return mapped;
  }

  async findByEquipo(equipoId: number) {
    return this.findAll({ equipoId })
  }

  async clearAll() {
    const result = await this.prisma.historialCambios.deleteMany({});
    return {
      message: 'Historial eliminado correctamente',
      deletedCount: result.count,
    };
  }
}
