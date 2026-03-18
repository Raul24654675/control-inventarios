import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AuthUser = {
  userId: number | string;
  email?: string;
  rol?: string;
};

@Injectable()
export class EquipoService {
  constructor(private prisma: PrismaService) {}

  // 🔎 Obtener todos los equipos con filtros opcionales
  async findAll(filters: any = {}) {
    const where: any = {};
    if (filters.sector) where.sector = filters.sector;
    if (filters.estado) where.estado = filters.estado;
    if (filters.nombre) where.nombre = { contains: filters.nombre, mode: 'insensitive' };
    if (filters.ubicacion) where.ubicacion = { contains: filters.ubicacion, mode: 'insensitive' };
    if (filters.id) where.id = filters.id;

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    return this.prisma.equipo.findMany({
      where,
      orderBy: {
        creadoEn: 'desc',
      },
      skip,
      take: limit,
    });
  }
  // 🔎 Obtener un equipo por ID
  async findOne(id: number) {
    const equipo = await this.prisma.equipo.findUnique({
      where: { id },
    });

    if (!equipo) {
      throw new NotFoundException('Equipo no encontrado');
    }

    return equipo;
  }

  // 📜 Historial completo (solo para ADMIN)
  async getHistorial() {
    return this.prisma.historialCambios.findMany({
      orderBy: { fecha: 'desc' },
      include: {
        equipo: true,
        usuario: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
      },
    });
  }

  // 📜 Historial del equipo (solo para ADMIN)
  async getHistorialByEquipo(equipoId: number) {
    return this.prisma.historialCambios.findMany({
      where: { equipoId },
      orderBy: { fecha: 'desc' },
      include: {
        equipo: true,
        usuario: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
      },
    });
  }

  // ➕ Crear un equipo y registrar el historial
  async create(data: any, user: AuthUser) {
    const createdEquipo = await this.prisma.equipo.create({
      data: {
        nombre: data.nombre,
        sector: data.sector,
        descripcion: data.descripcion,
        estado: data.estado,
        ubicacion: data.ubicacion,
      },
    });

    await this.prisma.historialCambios.create({
      data: {
        equipoId: createdEquipo.id,
        usuarioId: Number(user.userId),
        campo: 'CREACIÓN',
        valorAnterior: null,
        valorNuevo: JSON.stringify({
          nombre: createdEquipo.nombre,
          sector: createdEquipo.sector,
          descripcion: createdEquipo.descripcion,
          estado: createdEquipo.estado,
          ubicacion: createdEquipo.ubicacion,
        }),
      },
    });

    return createdEquipo;
  }

  // ✏ Actualizar un equipo y registrar cambios en historial
  async update(id: number, data: any, user: AuthUser) {
    const equipoExiste = await this.prisma.equipo.findUnique({
      where: { id },
    });

    if (!equipoExiste) {
      throw new NotFoundException('Equipo no encontrado');
    }

    // si es operador, no puede modificar sector ni estado
    if (user?.rol === 'OPERADOR') {
      delete data.sector;
      delete data.estado;
    }

    const actualizado = await this.prisma.equipo.update({
      where: { id },
      data: {
        nombre: data.nombre,
        sector: data.sector,
        descripcion: data.descripcion,
        estado: data.estado,
        ubicacion: data.ubicacion,
      },
    });

    const cambios: Array<{
      campo: string;
      anterior?: string | null;
      nuevo?: string | null;
    }> = [];

    if (data.nombre !== undefined && data.nombre !== equipoExiste.nombre) {
      cambios.push({
        campo: 'nombre',
        anterior: equipoExiste.nombre,
        nuevo: data.nombre,
      });
    }
    if (data.sector !== undefined && data.sector !== equipoExiste.sector) {
      cambios.push({
        campo: 'sector',
        anterior: equipoExiste.sector,
        nuevo: data.sector,
      });
    }
    if (data.descripcion !== undefined && data.descripcion !== equipoExiste.descripcion) {
      cambios.push({
        campo: 'descripcion',
        anterior: equipoExiste.descripcion ?? null,
        nuevo: data.descripcion,
      });
    }
    if (data.estado !== undefined && data.estado !== equipoExiste.estado) {
      cambios.push({
        campo: 'estado',
        anterior: equipoExiste.estado,
        nuevo: data.estado,
      });
    }
    if (data.ubicacion !== undefined && data.ubicacion !== equipoExiste.ubicacion) {
      cambios.push({
        campo: 'ubicacion',
        anterior: equipoExiste.ubicacion ?? null,
        nuevo: data.ubicacion,
      });
    }

    // Guardar solo si hubo cambios
    await Promise.all(
      cambios.map((cambio) =>
        this.prisma.historialCambios.create({
          data: {
            equipoId: actualizado.id,
            usuarioId: Number(user.userId),
            campo: cambio.campo,
            valorAnterior: cambio.anterior ?? null,
            valorNuevo: cambio.nuevo ?? null,
          },
        }),
      ),
    );

    return actualizado;
  }

  // ❌ Eliminar equipo y registrar el evento
  async remove(id: number, user: AuthUser) {
    const equipoExiste = await this.prisma.equipo.findUnique({
      where: { id },
    });

    if (!equipoExiste) {
      throw new NotFoundException('Equipo no encontrado');
    }

    const eliminado = await this.prisma.equipo.delete({
      where: { id },
    });

    await this.prisma.historialCambios.create({
      data: {
        equipoId: eliminado.id,
        usuarioId: Number(user.userId),
        campo: 'ELIMINACIÓN',
        valorAnterior: JSON.stringify({
          nombre: eliminado.nombre,
          sector: eliminado.sector,
          descripcion: eliminado.descripcion,
          estado: eliminado.estado,
          ubicacion: eliminado.ubicacion,
        }),
        valorNuevo: null,
      },
    });

    return eliminado;
  }
}