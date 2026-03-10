import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';

import { EquipoService } from './equipo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('equipos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EquipoController {
  constructor(private readonly equipoService: EquipoService) {}

  // 🔎 VER TODOS LOS EQUIPOS
  // ADMIN y OPERADOR
  @Roles('ADMIN', 'OPERADOR')
  @Get()
  findAll() {
    return this.equipoService.findAll();
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
  create(@Body() data: any) {
    return this.equipoService.create(data);
  }

  // ✏ ACTUALIZAR EQUIPO
  // ADMIN y OPERADOR
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'OPERADOR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.equipoService.update(Number(id), data);
  }

  // ❌ ELIMINAR EQUIPO
  // SOLO ADMIN
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipoService.remove(Number(id));
  }
}