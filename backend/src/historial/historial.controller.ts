import {
  Controller,
  Get,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { HistorialService } from './historial.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ERROR_MESSAGES } from '../common/error-messages';

@Controller('historial')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Roles('ADMIN', 'OPERADOR')
  @Get()
  findAll(
    @Query('equipoId') equipoId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    let parsedEquipoId: number | undefined
    if (equipoId) {
      parsedEquipoId = Number(equipoId)
      if (!Number.isInteger(parsedEquipoId) || parsedEquipoId <= 0) {
        throw new BadRequestException(ERROR_MESSAGES.HISTORIAL.INVALID_EQUIPO_ID)
      }
    }

    if ((fechaDesde && !fechaHasta) || (!fechaDesde && fechaHasta)) {
      throw new BadRequestException(ERROR_MESSAGES.HISTORIAL.INVALID_DATE_RANGE)
    }

    let parsedFechaDesde: Date | undefined
    let parsedFechaHasta: Date | undefined
    if (fechaDesde && fechaHasta) {
      parsedFechaDesde = new Date(fechaDesde)
      parsedFechaHasta = new Date(fechaHasta)
      if (Number.isNaN(parsedFechaDesde.getTime()) || Number.isNaN(parsedFechaHasta.getTime())) {
        throw new BadRequestException(ERROR_MESSAGES.HISTORIAL.INVALID_DATE_RANGE)
      }
      if (parsedFechaDesde > parsedFechaHasta) {
        throw new BadRequestException(ERROR_MESSAGES.HISTORIAL.INVALID_DATE_RANGE)
      }
    }

    return this.historialService.findAll({
      equipoId: parsedEquipoId,
      fechaDesde: parsedFechaDesde,
      fechaHasta: parsedFechaHasta,
    })
  }

  @Roles('ADMIN')
  @Delete()
  clearAll() {
    return this.historialService.clearAll();
  }
}
