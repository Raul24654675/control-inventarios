import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    try {
      const user = await this.prisma.usuario.create({
        data: {
          nombre: data.nombre,
          email: data.email,
          password: hashedPassword,
          rol: data.rol,
        },
      });
      return user;
    } catch (e: any) {
      // Prisma unique constraint error on email
      const target = e?.meta?.target;
      const targets = Array.isArray(target) ? target : typeof target === 'string' ? [target] : [];
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002' &&
        targets.includes('email')
      ) {
        throw new ConflictException('Email already registered');
      }
      throw e;
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) throw new UnauthorizedException('Usuario no existe');

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) throw new UnauthorizedException('Contraseña incorrecta');

    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}