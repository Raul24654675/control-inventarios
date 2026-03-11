import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { HistorialService } from './historial.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('historial')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Roles('ADMIN', 'OPERADOR')
  @Get()
  findAll(@Query('equipoId') equipoId?: string) {
    if (equipoId) {
      return this.historialService.findByEquipo(Number(equipoId));
    }
    return this.historialService.findAll();
  }
}
