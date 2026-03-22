import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistorialService {
  constructor(private prisma: PrismaService) {}

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

  private mapEntry(item: any) {
    const accion = this.normalizeAccion(item.campo);
    const anteriorRaw = this.parseJsonSafe(item.valorAnterior);
    const nuevoRaw = this.parseJsonSafe(item.valorNuevo);
    const anterior = accion === 'CREACION' && anteriorRaw == null ? {} : anteriorRaw;
    const nuevo = accion === 'ELIMINACION' && nuevoRaw == null ? {} : nuevoRaw;

    return {
      id: item.id,
      fecha: item.fecha,
      accion,
      campo: item.campo,
      equipo: {
        id: item.equipo?.id,
        nombre: item.equipo?.nombre,
        sector: item.equipo?.sector,
        estado: item.equipo?.estado,
        ubicacion: item.equipo?.ubicacion,
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

  async findAll() {
    const data = await this.prisma.historialCambios.findMany({
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

    return data.map((item) => this.mapEntry(item));
  }

  async findByEquipo(equipoId: number) {
    const data = await this.prisma.historialCambios.findMany({
      where: { equipoId },
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

    return data.map((item) => this.mapEntry(item));
  }
}
