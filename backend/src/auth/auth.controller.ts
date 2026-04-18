import { Controller, Post, Body, UseGuards, Get, Query, BadRequestException, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Registro de operadores por un administrador.
  // Se mantiene disponible para pruebas, pero no se publica en el tester.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('register')
  register(@Body() data: any) {
    return this.authService.registerUserByAdmin(data);
  }

  @Post('login')
  login(@Body() data: any) {
    return this.authService.login(data.email, data.password);
  }

  @Post('login/admin')
  loginAdmin(@Body() data: any) {
    return this.authService.loginAdmin(data.email, data.password);
  }

  @Post('login/operador')
  loginOperador(@Body() data: any) {
    return this.authService.loginOperador(data.email, data.password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('users')
  listUsers(@Query('id') id?: string, @Query('nombre') nombre?: string, @Query('email') email?: string, @Query('activo') activo?: string) {
    if (id !== undefined && id !== '') {
      if (!/^\d+$/.test(id)) {
        throw new BadRequestException('El id solo puede contener numeros');
      }
    }

    const activoLower = activo?.toLowerCase()
    const activeFilter = activoLower === 'activo' ? true : activoLower === 'inactivo' ? false : undefined

    return this.authService.listUsers({
      id,
      nombre,
      email,
      activo: activeFilter,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('users/:id/password')
  updateOperadorPassword(@Param('id') id: string, @Body() data: { password?: string }) {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw new BadRequestException('El id debe ser un numero entero mayor o igual a 1');
    }

    return this.authService.updateOperadorPassword(parsedId, data?.password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('users/:id/activo')
  updateOperadorActivo(@Param('id') id: string, @Body() data: { activo: boolean }) {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw new BadRequestException('El id debe ser un numero entero mayor o igual a 1');
    }

    if (typeof data?.activo !== 'boolean') {
      throw new BadRequestException('El estado activo debe ser booleano');
    }

    return this.authService.updateOperadorActivo(parsedId, data.activo);
  }
}