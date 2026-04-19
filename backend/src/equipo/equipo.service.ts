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

  private readonly sectoresValidos = ['Electrica', 'Neumatica', 'Electronica'];
  private readonly estadosValidos = ['Activo', 'Inactivo', 'EnMantenimiento'];
  private readonly ubicacionesValidas = [
    'EN ALMACEN',
    '201-A',
    '202-A',
    '203-A',
    '204-A',
    '301-A',
    '302-A',
    '303-A',
    '304-A',
    '201-B',
    '202-B',
    '203-B',
    '204-B',
    '301-B',
    '302-B',
    '303-B',
    '304-B',
  ];

  private validarSector(sector?: string) {
    if (sector !== undefined && !this.sectoresValidos.includes(sector)) {
      throw new BadRequestException(ERROR_MESSAGES.EQUIPO.INVALID_SECTOR);
    }
  }

  private normalizarSector(sector?: string): string | undefined {
    if (sector === undefined) return undefined;
    const raw = String(sector).trim().toLowerCase();

    if (raw === 'electrica') return 'Electrica';
    if (raw === 'neumatica') return 'Neumatica';
    if (raw === 'electronica' || raw === 'mecanica') return 'Electronica';

    return sector;
  }

  private validarEstado(estado?: string) {
    if (estado !== undefined && !this.estadosValidos.includes(estado)) {
      throw new BadRequestException(ERROR_MESSAGES.EQUIPO.INVALID_ESTADO);
    }
  }

  private normalizarEstado(estado?: string): string | undefined {
    if (estado === undefined) return undefined;
    const raw = String(estado).trim().toLowerCase();

    if (raw === 'activo') return 'Activo';
    if (raw === 'inactivo') return 'Inactivo';
    if (raw === 'mantenimiento' || raw === 'en mantenimiento' || raw === 'enmantenimiento') {
      return 'EnMantenimiento';
    }

    return estado;
  }

  private normalizarUbicacion(ubicacion?: string | null): string | null | undefined {
    if (ubicacion === undefined) return undefined;
    if (ubicacion === null) return null;

    const valor = String(ubicacion).trim();
    if (valor === '') return null;
    return valor.toUpperCase();
  }

  private validarUbicacion(ubicacion?: string | null) {
    if (ubicacion !== undefined && ubicacion !== null && !this.ubicacionesValidas.includes(ubicacion)) {
      throw new BadRequestException(ERROR_MESSAGES.EQUIPO.INVALID_UBICACION);
    }
  }

  // 🔎 Obtener todos los equipos con filtros opcionales
  async findAll(filters: FindEquiposDto = {}) {
    const where: any = {};
    const idFiltro =
      (filters as any).id !== undefined && (filters as any).id !== null
        ? String((filters as any).id).trim()
        : undefined;

    if (filters.sector) where.sector = this.normalizarSector(filters.sector);
    if (filters.estado) where.estado = this.normalizarEstado(filters.estado);
    if (filters.nombre) where.nombre = { contains: filters.nombre, mode: 'insensitive' };
    if (filters.ubicacion) where.ubicacion = { contains: filters.ubicacion, mode: 'insensitive' };

    const page = Number(filters.page ?? 1);
    const limit = Number(filters.limit ?? 20);
    const skip = (page - 1) * limit;

    // El filtro por ID es por coincidencia parcial (ej. "1" -> 1, 10, 21, 100)
    if (idFiltro) {
      const equipos = await this.prisma.equipo.findMany({
        where,
        orderBy: { id: 'asc' },
      });

      return equipos.filter((equipo) => String(equipo.id).includes(idFiltro)).slice(skip, skip + limit);
    }

    return this.prisma.equipo.findMany({
      where,
      orderBy: { id: 'asc' },
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
    const descripcion = typeof data?.descripcion === 'string' ? data.descripcion.trim() : '';
    const ubicacion = this.normalizarUbicacion(data?.ubicacion);

    if (!data?.nombre || !data?.sector || !data?.estado || !descripcion || !ubicacion) {
      throw new BadRequestException(ERROR_MESSAGES.EQUIPO.CREATE_REQUIRED_FIELDS);
    }

    const sector = this.normalizarSector(data.sector);
    this.validarSector(sector);
    const estado = this.normalizarEstado(data.estado);
    this.validarEstado(estado);
    this.validarUbicacion(ubicacion);

    const createData: any = {
      nombre: data.nombre,
      sector,
      descripcion,
      estado,
      ubicacion,
    };

    const createdEquipo = await this.prisma.equipo.create({
      data: createData,
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

    const sector = this.normalizarSector(data.sector);
    this.validarSector(sector);
    const estado = this.normalizarEstado(data.estado);
    this.validarEstado(estado);
    const ubicacion = this.normalizarUbicacion(data.ubicacion);
    this.validarUbicacion(ubicacion);

    const updateData: any = {
      nombre: data.nombre,
      sector,
      descripcion: data.descripcion,
      estado,
      ubicacion,
    };

    const actualizado = await this.prisma.equipo.update({
      where: { id },
      data: updateData,
    });

    const cambiosAnteriores: Record<string, string | null> = {};
    const cambiosNuevos: Record<string, string | null> = {};

    if (data.nombre !== undefined && data.nombre !== equipoExiste.nombre) {
      cambiosAnteriores.nombre = equipoExiste.nombre;
      cambiosNuevos.nombre = data.nombre;
    }
    if (sector !== undefined && sector !== equipoExiste.sector) {
      cambiosAnteriores.sector = equipoExiste.sector;
      cambiosNuevos.sector = sector;
    }
    if (data.descripcion !== undefined && data.descripcion !== equipoExiste.descripcion) {
      cambiosAnteriores.descripcion = equipoExiste.descripcion ?? null;
      cambiosNuevos.descripcion = data.descripcion;
    }
    if (estado !== undefined && estado !== equipoExiste.estado) {
      cambiosAnteriores.estado = equipoExiste.estado;
      cambiosNuevos.estado = estado;
    }
    if (ubicacion !== undefined && ubicacion !== equipoExiste.ubicacion) {
      cambiosAnteriores.ubicacion = equipoExiste.ubicacion ?? null;
      cambiosNuevos.ubicacion = ubicacion;
    }

    // Guardar en un solo registro todos los cambios aplicados en esta actualizacion.
    if (Object.keys(cambiosAnteriores).length > 0) {
      await this.prisma.historialCambios.create({
        data: {
          equipoId: actualizado.id,
          usuarioId: Number(user.userId),
          campo: 'ACTUALIZACION',
          valorAnterior: JSON.stringify(cambiosAnteriores),
          valorNuevo: JSON.stringify(cambiosNuevos),
        },
      });
    }

    return actualizado;
  }

  // 🚨 Actualizar estado del equipo con detalles de inactividad
  async updateEstado(id: number, dto: any, user: AuthUser) {
    const equipoExiste = await this.prisma.equipo.findUnique({
      where: { id },
    });

    if (!equipoExiste) {
      throw new NotFoundException(ERROR_MESSAGES.EQUIPO.NOT_FOUND);
    }

    const estado = this.normalizarEstado(dto.estado);
    this.validarEstado(estado);

    // Actualizar el estado del equipo
    const actualizado = await this.prisma.equipo.update({
      where: { id },
      data: { estado: estado as any },
    });

    // Si el estado cambia a Inactivo, registrar los detalles de inactividad
    if (estado === 'Inactivo' && dto.motivo) {
      await this.prisma.registroInactividad.create({
        data: {
          equipoId: id,
          usuarioId: Number(user.userId),
          motivo: dto.motivo,
          descripcion: dto.descripcion || '',
          tiempoEstimado: dto.tiempoEstimado || 'Indefinido',
          accionRequerida: dto.accionRequerida || 'Inspeccion',
          prioridad: dto.prioridad || 'Media',
          evidenciaUrl: dto.evidenciaUrl,
        },
      });
    }

    // Registrar el cambio en el historial con detalle completo
    const detalle: Record<string, unknown> = { estado };

    if (estado === 'Inactivo' && dto.motivo) {
      Object.assign(detalle, {
        motivo: dto.motivo,
        descripcion: dto.descripcion || '',
        tiempoEstimado: dto.tiempoEstimado || 'Indefinido',
        accionRequerida: dto.accionRequerida || 'Inspeccion',
        prioridad: dto.prioridad || 'Media',
        evidenciaUrl: dto.evidenciaUrl || null,
      });
    }

    if (estado === 'EnMantenimiento') {
      Object.assign(detalle, {
        tipoMantenimiento: dto.tipoMantenimiento || null,
        motivoMantenimiento: dto.motivoMantenimiento || null,
        fechaInicio: dto.fechaInicio || null,
        horaInicio: dto.horaInicio || null,
        descripcionTecnica: dto.descripcionTecnica || null,
        tiempoEstimadoMantenimiento: dto.tiempoEstimadoMantenimiento || null,
        fechaFinEstimada: dto.fechaFinEstimada || null,
        prioridadMantenimiento: dto.prioridadMantenimiento || null,
        costoManoObra: dto.costoManoObra || null,
        costoRepuestos: dto.costoRepuestos || null,
        costoTotal: dto.costoTotal || null,
        evidenciaMantenimiento: dto.evidenciaMantenimiento || null,
      });
    }

    if (estado === 'Activo') {
      const estadoPrevio = dto.estadoPrevio || equipoExiste.estado;
      Object.assign(detalle, { estadoPrevio });

      if (estadoPrevio === 'Inactivo') {
        Object.assign(detalle, {
          motivoReactivacion: dto.motivoReactivacion || null,
          justificacionReactivacion: dto.justificacionReactivacion || null,
          observacionesReactivacion: dto.observacionesReactivacion || null,
        });
      } else if (estadoPrevio === 'EnMantenimiento') {
        Object.assign(detalle, {
          tipoMantenimientoRealizado: dto.tipoMantenimientoRealizado || null,
          resultadoMantenimiento: dto.resultadoMantenimiento || null,
          pruebasRealizadas: dto.pruebasRealizadas || [],
          descripcionReparacion: dto.descripcionReparacion || null,
          condicionActual: dto.condicionActual || null,
        });
      }
    }

    await this.prisma.historialCambios.create({
      data: {
        equipoId: actualizado.id,
        usuarioId: Number(user.userId),
        campo: 'estado',
        valorAnterior: JSON.stringify({ estado: equipoExiste.estado }),
        valorNuevo: JSON.stringify(detalle),
      },
    });

    return actualizado;
  }
}