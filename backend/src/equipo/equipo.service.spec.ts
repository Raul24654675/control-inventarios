import { Test, TestingModule } from '@nestjs/testing';
import { EquipoService } from './equipo.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EquipoService', () => {
  let service: EquipoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipoService,
        {
          provide: PrismaService,
          useValue: {
            equipo: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            historialCambios: {
              create: jest.fn(),
              findMany: jest.fn(),
              deleteMany: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EquipoService>(EquipoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
