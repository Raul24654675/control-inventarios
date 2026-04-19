import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  BadRequestException,
  Patch,
  Param,
  UsePipes,
  ValidationPipe,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateOperadorPasswordDto } from './dto/update-operador-password.dto';
import { UpdateOperadorActivoDto } from './dto/update-operador-activo.dto';

const LOGIN_WINDOW_MS = 60_000;
const LOGIN_ATTEMPTS_MAX = 8;
const loginAttempts = new Map<string, number[]>();

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private consumeLoginAttempt(email: string, ip: string, channel: string) {
    const key = `${channel}|${email.toLowerCase()}|${ip}`;
    const now = Date.now();
    const recentAttempts = (loginAttempts.get(key) ?? []).filter((time) => now - time < LOGIN_WINDOW_MS);

    if (recentAttempts.length >= LOGIN_ATTEMPTS_MAX) {
      throw new HttpException(
        'Demasiados intentos de inicio de sesion. Intenta nuevamente en un minuto.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recentAttempts.push(now);
    loginAttempts.set(key, recentAttempts);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  register(@Body() data: RegisterUserDto) {
    return this.authService.registerUserByAdmin(data);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  login(@Body() data: LoginDto, @Req() request: any) {
    this.consumeLoginAttempt(data.email, request.ip ?? 'unknown', 'general');
    return this.authService.login(data.email, data.password);
  }

  @Post('login/admin')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  loginAdmin(@Body() data: LoginDto, @Req() request: any) {
    this.consumeLoginAttempt(data.email, request.ip ?? 'unknown', 'admin');
    return this.authService.loginAdmin(data.email, data.password);
  }

  @Post('login/operador')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  loginOperador(@Body() data: LoginDto, @Req() request: any) {
    this.consumeLoginAttempt(data.email, request.ip ?? 'unknown', 'operador');
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

    const activoLower = activo?.toLowerCase();
    const activeFilter = activoLower === 'activo' ? true : activoLower === 'inactivo' ? false : undefined;

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
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  updateOperadorPassword(@Param('id') id: string, @Body() data: UpdateOperadorPasswordDto) {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw new BadRequestException('El id debe ser un numero entero mayor o igual a 1');
    }

    return this.authService.updateOperadorPassword(parsedId, data.password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('users/:id/activo')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  updateOperadorActivo(@Param('id') id: string, @Body() data: UpdateOperadorActivoDto) {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw new BadRequestException('El id debe ser un numero entero mayor o igual a 1');
    }

    return this.authService.updateOperadorActivo(parsedId, data.activo);
  }
}
