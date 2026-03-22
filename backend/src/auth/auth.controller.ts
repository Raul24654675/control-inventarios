import { Controller, Post, Body, UseGuards } from '@nestjs/common';
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
}