import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // clean database once at start
    const prisma = app.get(PrismaService);
    await prisma.historialCambios.deleteMany();
    await prisma.equipo.deleteMany();
    await prisma.usuario.deleteMany();

    const hashed = await bcrypt.hash('pwd', 10);
    await prisma.usuario.create({
      data: {
        nombre: 'Admin',
        email: 'adm@e.com',
        password: hashed,
        rol: 'ADMIN',
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.text).toBe('Hello World!');
      });
  });

  describe('auth and equipos', () => {
    let adminToken: string;
    let opToken: string;
    let createdId: number;

    it('should login admin with admin endpoint', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login/admin')
        .send({ email: 'adm@e.com', password: 'pwd' });
      expect(res.status).toBe(201);
      adminToken = res.body.access_token;
    });

    it('admin should register operador', async () => {
      const opRes = await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Op', email: 'op@e.com', password: 'pwd', rol: 'OPERADOR' });
      expect(opRes.status).toBe(201);
      expect(opRes.body.message).toBe('Usuario creado con éxito');
      expect(opRes.body.usuario.rol).toBe('OPERADOR');
      expect(opRes.body.usuario.password).toBeUndefined();
    });

    it('should login operador with operador endpoint', async () => {
      const res2 = await request(app.getHttpServer())
        .post('/auth/login/operador')
        .send({ email: 'op@e.com', password: 'pwd' });
      expect(res2.status).toBe(201);
      opToken = res2.body.access_token;
    });

    it('should return Usuario no encontrado when user does not exist', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login/admin')
        .send({ email: 'no-existe@e.com', password: 'pwd' });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Usuario no encontrado');
    });

    it('should return Credenciales invalidas when password is incorrect', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login/operador')
        .send({ email: 'op@e.com', password: 'incorrecta' });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Clave incorrecta');
    });

    it('should return role mismatch message when trying admin login with operador user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login/admin')
        .send({ email: 'op@e.com', password: 'pwd' });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('La accion no corresponde al rol del usuario');
    });

    it('operador cannot create equipo', async () => {
      const res = await request(app.getHttpServer())
        .post('/equipos')
        .set('Authorization', `Bearer ${opToken}`)
        .send({ nombre: 'E1', sector: 'ELECTRICA', estado: 'ACTIVO' });
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('La accion no esta permitida para este rol');
    });

    it('admin can create equipo', async () => {
      const res = await request(app.getHttpServer())
        .post('/equipos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'E1', sector: 'ELECTRICA', estado: 'ACTIVO' });
      expect(res.status).toBe(201);
      createdId = res.body.id;
    });

    it('filters on findAll work', async () => {
      const res = await request(app.getHttpServer())
        .get('/equipos?sector=ELECTRICA&estado=ACTIVO')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('operador update cannot change sector/estado', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/equipos/${createdId}`)
        .set('Authorization', `Bearer ${opToken}`)
        .send({ nombre: 'Nuevo', sector: 'NEUMATICA', estado: 'INACTIVO' });
      expect(res.status).toBe(200);
      expect(res.body.sector).toBe('ELECTRICA');
      expect(res.body.estado).toBe('ACTIVO');
    });

    it('operador cannot delete equipo', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/equipos/${createdId}`)
        .set('Authorization', `Bearer ${opToken}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('La accion no esta permitida para este rol');
    });

    it('should return token required when auth header is missing', async () => {
      const res = await request(app.getHttpServer()).get('/equipos');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Token requerido');
    });

    it('should return equipo no encontrado on unknown id', async () => {
      const res = await request(app.getHttpServer())
        .get('/equipos/999999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Equipo no encontrado');
    });

    it('admin can delete equipo without 500', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/equipos/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdId);
    });

    it('history endpoint returns entries', async () => {
      const res = await request(app.getHttpServer())
        .get('/historial')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
