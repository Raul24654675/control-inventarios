import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EquipoService {
  constructor(private prisma: PrismaService) {}

  // 🔎 Obtener todos los equipos
  async findAll() {
    return this.prisma.equipo.findMany({
      orderBy: {
        creadoEn: 'desc',
      },
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
  async create(data: any) {
    return this.prisma.equipo.create({
      data: {
        nombre: data.nombre,
        sector: data.sector,
        descripcion: data.descripcion,
        estado: data.estado,
        ubicacion: data.ubicacion,
      },
    });
  }

  // ✏ Actualizar un equipo
  async update(id: number, data: any) {
    const equipoExiste = await this.prisma.equipo.findUnique({
      where: { id },
    });

    if (!equipoExiste) {
      throw new NotFoundException('Equipo no encontrado');
    }

    return this.prisma.equipo.update({
      where: { id },
      data: {
        nombre: data.nombre,
        sector: data.sector,
        descripcion: data.descripcion,
        estado: data.estado,
        ubicacion: data.ubicacion,
      },
    });
  }

  // ❌ Eliminar equipo
  async remove(id: number) {
    const equipoExiste = await this.prisma.equipo.findUnique({
      where: { id },
    });

    if (!equipoExiste) {
      throw new NotFoundException('Equipo no encontrado');
    }

    return this.prisma.equipo.delete({
      where: { id },
    });
  }
}