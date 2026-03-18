import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';

import { EquipoService } from './equipo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('equipos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipoController {
  constructor(private readonly equipoService: EquipoService) {}

  // 🔎 VER TODOS LOS EQUIPOS (con filtros y paginación)
  // ADMIN y OPERADOR
  @Roles('ADMIN', 'OPERADOR')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @Get()
  findAll(@Query() query: any) {
    return this.equipoService.findAll(query);
  }

  // 📜 HISTORIAL DE CAMBIOS (ADMIN y OPERADOR)
  @Roles('ADMIN', 'OPERADOR')
  @Get('historial')
  getHistorial() {
    return this.equipoService.getHistorial();
  }

  // 📜 HISTORIAL DE CAMBIOS POR EQUIPO (ADMIN y OPERADOR)
  @Roles('ADMIN', 'OPERADOR')
  @Get(':id/historial')
  getHistorialByEquipo(@Param('id') id: string) {
    return this.equipoService.getHistorialByEquipo(Number(id));
  }

  // 🔎 VER UN EQUIPO POR ID
  // ADMIN y OPERADOR
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'OPERADOR')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equipoService.findOne(Number(id));
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
    return this.equipoService.update(Number(id), data, req.user as any);
  }

  // ❌ ELIMINAR EQUIPO
  // SOLO ADMIN
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: ExpressRequest) {
    return this.equipoService.remove(Number(id), req.user as any);
  }
}