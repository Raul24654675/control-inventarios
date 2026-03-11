import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EquipoService {
  constructor(private prisma: PrismaService) {}

  // 🔎 Obtener todos los equipos con filtros opcionales
  async findAll(filters: any = {}) {
    const where: any = {};
    if (filters.sector) where.sector = filters.sector;
    if (filters.estado) where.estado = filters.estado;
    if (filters.nombre) where.nombre = { contains: filters.nombre, mode: 'insensitive' };

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

  // ➕ Crear un equipo
  async create(data: any, user: any) {
    const equipo = await this.prisma.equipo.create({
      data: {
        nombre: data.nombre,
        sector: data.sector,
        descripcion: data.descripcion,
        estado: data.estado,
        ubicacion: data.ubicacion,
      },
    });

    // registro de creación en historial
    await this.prisma.historialCambios.create({
      data: {
        equipoId: equipo.id,
        usuarioId: user.userId,
        campo: 'CREACION',
        valorAnterior: null,
        valorNuevo: JSON.stringify(data),
      },
    });

    return equipo;
  }

  // ✏ Actualizar un equipo
  async update(id: number, data: any, user: any) {
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

    const updated = await this.prisma.equipo.update({
      where: { id },
      data: {
        nombre: data.nombre,
        sector: data.sector,
        descripcion: data.descripcion,
        estado: data.estado,
        ubicacion: data.ubicacion,
      },
    });

    // grabar cambios individuales en el historial
    const campos: Array<keyof typeof equipoExiste> = [
      'nombre',
      'sector',
      'descripcion',
      'estado',
      'ubicacion',
    ];

    for (const campo of campos) {
      const anterior = equipoExiste[campo];
      const nuevo = data[campo];
      if (nuevo !== undefined && anterior !== nuevo) {
        await this.prisma.historialCambios.create({
          data: {
            equipoId: id,
            usuarioId: user.userId,
            campo: String(campo),
            valorAnterior: anterior == null ? null : String(anterior),
            valorNuevo: nuevo == null ? null : String(nuevo),
          },
        });
      }
    }

    return updated;
  }

  // ❌ Eliminar equipo
  async remove(id: number, user: any) {
    const equipoExiste = await this.prisma.equipo.findUnique({
      where: { id },
    });

    if (!equipoExiste) {
      throw new NotFoundException('Equipo no encontrado');
    }

    // registrar eliminación antes de borrar
    await this.prisma.historialCambios.create({
      data: {
        equipoId: id,
        usuarioId: user.userId,
        campo: 'ELIMINACION',
        valorAnterior: JSON.stringify(equipoExiste),
        valorNuevo: null,
      },
    });

    return this.prisma.equipo.delete({
      where: { id },
    });
  }
}