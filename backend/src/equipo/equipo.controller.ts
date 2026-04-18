import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { EquipoService } from './equipo.service';
import { FindEquiposDto } from './dto/find-equipos.dto';
import { UpdateEstadoEquipoDto } from './dto/update-estado-equipo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ERROR_MESSAGES } from '../common/error-messages';

@Controller('equipos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipoController {
  constructor(private readonly equipoService: EquipoService) {}

  private parseEquipoId(id: string): number {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.EQUIPO.INVALID_ID);
    }
    return parsed;
  }

  // 🔎 VER TODOS LOS EQUIPOS (con filtros y paginación)
  // ADMIN y OPERADOR
  @Roles('ADMIN', 'OPERADOR')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @Get()
  findAll(@Query() query: FindEquiposDto) {
    return this.equipoService.findAll(query);
  }

  // 🔎 VER UN EQUIPO POR ID
  // ADMIN y OPERADOR
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'OPERADOR')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equipoService.findOne(this.parseEquipoId(id));
  }

  // ➕ CREAR EQUIPO
  // SOLO ADMIN
  @Roles('ADMIN')
  @Post()
  create(@Body() data: any, @Req() req: ExpressRequest) {
    return this.equipoService.create(data, req.user as any);
  }

  // ✏ ACTUALIZAR EQUIPO
  // ADMIN y OPERADOR
  @Roles('ADMIN', 'OPERADOR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any, @Req() req: ExpressRequest) {
    return this.equipoService.update(this.parseEquipoId(id), data, req.user as any);
  }

  // 🚨 ACTUALIZAR ESTADO DEL EQUIPO (con detalles de inactividad)
  // ADMIN y OPERADOR
  @Roles('ADMIN', 'OPERADOR')
  @Patch(':id/estado')
  @UsePipes(new ValidationPipe({ forbidNonWhitelisted: true, skipMissingProperties: true }))
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdateEstadoEquipoDto,
    @Req() req: ExpressRequest,
  ) {
    return this.equipoService.updateEstado(this.parseEquipoId(id), dto, req.user as any);
  }
}