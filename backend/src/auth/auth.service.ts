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

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) throw new UnauthorizedException(ERROR_MESSAGES.AUTH.WRONG_PASSWORD);
    if (user.rol !== role) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.ROLE_ACTION_MISMATCH);
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
}