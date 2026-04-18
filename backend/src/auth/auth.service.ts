import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { ERROR_MESSAGES } from '../common/error-messages';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerUserByAdmin(data: any) {
    if (!data?.nombre || !data?.email || !data?.password) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.REGISTER_REQUIRED_FIELDS);
    }

    const rol = data.rol ?? 'OPERADOR';
    if (rol !== 'ADMIN' && rol !== 'OPERADOR') {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.INVALID_ROLE);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    try {
      const user = await this.prisma.usuario.create({
        data: {
          nombre: data.nombre,
          email: data.email,
          password: hashedPassword,
          rol,
        },
      });

      return {
        message: 'Usuario creado con éxito',
        usuario: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          creadoEn: user.creadoEn,
        },
      };
    } catch (e: any) {
      // Prisma unique constraint error on email
      const target = e?.meta?.target;
      const targets = Array.isArray(target) ? target : typeof target === 'string' ? [target] : [];
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002' &&
        targets.includes('email')
      ) {
        throw new ConflictException(ERROR_MESSAGES.AUTH.EMAIL_ALREADY_REGISTERED);
      }
      throw e;
    }
  }

  private async loginByRole(email: string, password: string, role: 'ADMIN' | 'OPERADOR') {
    if (!email || !password) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.LOGIN_REQUIRED_FIELDS);
    }

    const user = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);

    if (user.rol !== role) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.ROLE_ACTION_MISMATCH);
    }

    if (!user.activo) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_INACTIVE);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException(ERROR_MESSAGES.AUTH.WRONG_PASSWORD);

    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.LOGIN_REQUIRED_FIELDS);
    }

    const user = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    if (!user.activo) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_INACTIVE);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.WRONG_PASSWORD);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async loginAdmin(email: string, password: string) {
    return this.loginByRole(email, password, 'ADMIN');
  }

  async loginOperador(email: string, password: string) {
    return this.loginByRole(email, password, 'OPERADOR');
  }

  async listUsers(filters: { id?: string; nombre?: string; email?: string; activo?: boolean } = {}) {
    const where: any = {};

    if (filters.nombre) {
      where.nombre = { contains: filters.nombre, mode: 'insensitive' };
    }
    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }
    if (typeof filters.activo === 'boolean') {
      where.activo = filters.activo;
    }

    const users = await this.prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    if (!filters.id) {
      return users;
    }

    return users.filter((user) => String(user.id).includes(filters.id as string));
  }

  async updateOperadorPassword(userId: number, newPassword?: string) {
    if (!newPassword || !newPassword.trim()) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.PASSWORD_REQUIRED);
    }

    const plainPassword = newPassword.trim();

    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }
    if (user.rol !== 'OPERADOR') {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.PASSWORD_TARGET_MUST_BE_OPERADOR);
    }

    const isSamePassword = await bcrypt.compare(plainPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('ingresa una contraseña diferente a la actual');
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await this.prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Clave actualizada correctamente' };
  }

  async updateOperadorActivo(userId: number, activo: boolean) {
    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }
    if (user.rol !== 'OPERADOR') {
      throw new BadRequestException('Solo se pueden cambiar el estado de usuarios con rol OPERADOR');
    }

    const action = activo ? 'reactivado' : 'marcado como inactivo';
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { activo },
    });

    return { message: `Usuario ${action} correctamente`, activo };
  }

  async deleteOperador(userId: number, actorId?: number) {
    if (Number.isInteger(actorId) && actorId === userId) {
      throw new BadRequestException('No puedes eliminar tu propio usuario');
    }

    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    if (user.rol !== 'OPERADOR') {
      throw new BadRequestException('Solo se pueden eliminar usuarios con rol OPERADOR');
    }

    const historialCount = await this.prisma.historialCambios.count({
      where: { usuarioId: userId },
    });

    if (historialCount > 0) {
      throw new BadRequestException('No se puede eliminar el usuario porque tiene registros en historial');
    }

    await this.prisma.usuario.delete({ where: { id: userId } });
    return { message: 'Usuario eliminado correctamente' };
  }
}