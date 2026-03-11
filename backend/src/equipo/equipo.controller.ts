import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { EquipoService } from './equipo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('equipos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipoController {
  constructor(private readonly equipoService: EquipoService) {}

  // DTO import
  private readonly validatePipe = new ValidationPipe({ transform: true, whitelist: true });

  // 🔎 VER TODOS LOS EQUIPOS (con filtros y paginación)
  // ADMIN y OPERADOR
  @Roles('ADMIN', 'OPERADOR')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @Get()
  findAll(@Query() query: any) {
    return this.equipoService.findAll(query);
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
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() data: any, @Request() req: any) {
    return this.equipoService.create(data, req.user);
  }

  // ✏ ACTUALIZAR EQUIPO
  // ADMIN y OPERADOR
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'OPERADOR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.equipoService.update(Number(id), data, req.user);
  }

  // ❌ ELIMINAR EQUIPO
  // SOLO ADMIN
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.equipoService.remove(Number(id), req.user);
  }
}