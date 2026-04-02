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
  listUsers(@Query('id') id?: string, @Query('nombre') nombre?: string, @Query('email') email?: string) {
    if (id !== undefined && id !== '') {
      if (!/^\d+$/.test(id)) {
        throw new BadRequestException('El id solo puede contener numeros');
      }
    }

    return this.authService.listUsers({
      id,
      nombre,
      email,
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
}