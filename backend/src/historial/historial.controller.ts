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
  findAll(@Query('equipoId') equipoId?: string) {
    if (equipoId) {
      const parsed = Number(equipoId);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new BadRequestException(ERROR_MESSAGES.HISTORIAL.INVALID_EQUIPO_ID);
      }
      return this.historialService.findByEquipo(parsed);
    }
    return this.historialService.findAll();
  }

  @Roles('ADMIN')
  @Delete()
  clearAll() {
    return this.historialService.clearAll();
  }
}
