import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindEquiposDto } from './dto/find-equipos.dto';
import { ERROR_MESSAGES } from '../common/error-messages';

type AuthUser = {
  userId: number | string;
  email?: string;
  rol?: string;
};

@Injectable()
export class EquipoService {
  constructor(private prisma: PrismaService) {}

  private readonly sectoresValidos = ['ELECTRICA', 'NEUMATICA', 'MECANICA'];
  private readonly estadosValidos = ['ACTIVO', 'INACTIVO', 'MANTENIMIENTO'];

  private validarSector(sector?: string) {
    if (sector !== undefined && !this.sectoresValidos.includes(sector)) {
      throw new BadRequestException(ERROR_MESSAGES.EQUIPO.INVALID_SECTOR);
    }
  }

  private validarEstado(estado?: string) {
    if (estado !== undefined && !this.estadosValidos.includes(estado)) {
      throw new BadRequestException(ERROR_MESSAGES.EQUIPO.INVALID_ESTADO);
    }
  }

  // 🔎 Obtener todos los equipos con filtros opcionales
  async findAll(filters: FindEquiposDto = {}) {
    const where: any = {};
    if (filters.sector) where.sector = filters.sector;
    if (filters.estado) where.estado = filters.estado;
    if (filters.nombre) where.nombre = { contains: filters.nombre, mode: 'insensitive' };
    if (filters.ubicacion) where.ubicacion = { contains: filters.ubicacion, mode: 'insensitive' };
    if ((filters as any).id !== undefined) where.id = Number((filters as any).id);

    const page = Number(filters.page ?? 1);
    const limit = Number(filters.limit ?? 20);
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
      throw new NotFoundException(ERROR_MESSAGES.EQUIPO.NOT_FOUND);
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
    if (!data?.nombre || !data?.sector || !data?.estado) {
      throw new BadRequestException(ERROR_MESSAGES.EQUIPO.CREATE_REQUIRED_FIELDS);
    }

    this.validarSector(data.sector);
    this.validarEstado(data.estado);

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
        valorAnterior: JSON.stringify({}),
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
      throw new NotFoundException(ERROR_MESSAGES.EQUIPO.NOT_FOUND);
    }

    // si es operador, no puede modificar sector ni estado
    if (user?.rol === 'OPERADOR') {
      delete data.sector;
      delete data.estado;
    }

    this.validarSector(data.sector);
    this.validarEstado(data.estado);

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
      throw new NotFoundException(ERROR_MESSAGES.EQUIPO.NOT_FOUND);
    }

    // Con FK RESTRICT en HistorialCambios -> Equipo, primero limpiar historial del equipo.
    return this.prisma.$transaction(async (tx) => {
      await tx.historialCambios.deleteMany({
        where: { equipoId: id },
      });

      const eliminado = await tx.equipo.delete({
        where: { id },
      });

      return eliminado;
    });
  }
}