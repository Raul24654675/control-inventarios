import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('auth and equipos', () => {
    let adminToken: string;
    let opToken: string;
    let createdId: number;

    it('should register admin and operador', async () => {
      const adminRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ nombre: 'Admin', email: 'adm@e.com', password: 'pwd', rol: 'ADMIN' });
      expect(adminRes.status).toBe(201);

      const opRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ nombre: 'Op', email: 'op@e.com', password: 'pwd', rol: 'OPERADOR' });
      expect(opRes.status).toBe(201);
    });

    it('should login both users', async () => {
      const res1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'adm@e.com', password: 'pwd' });
      expect(res1.status).toBe(201);
      adminToken = res1.body.access_token;

      const res2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'op@e.com', password: 'pwd' });
      expect(res2.status).toBe(201);
      opToken = res2.body.access_token;
    });

    it('operador cannot create equipo', async () => {
      const res = await request(app.getHttpServer())
        .post('/equipos')
        .set('Authorization', `Bearer ${opToken}`)
        .send({ nombre: 'E1', sector: 'ELECTRICA', estado: 'ACTIVO' });
      expect(res.status).toBe(403);
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

    it('history endpoint returns entries', async () => {
      const res = await request(app.getHttpServer())
        .get('/historial')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });
});
