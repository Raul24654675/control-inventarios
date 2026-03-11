import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistorialService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.historialCambios.findMany({
      orderBy: { fecha: 'desc' },
    });
  }

  findByEquipo(equipoId: number) {
    return this.prisma.historialCambios.findMany({
      where: { equipoId },
      orderBy: { fecha: 'desc' },
    });
  }
}
