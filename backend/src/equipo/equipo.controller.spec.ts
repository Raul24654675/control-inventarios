import { Test, TestingModule } from '@nestjs/testing';
import { EquipoController } from './equipo.controller';
import { EquipoService } from './equipo.service';

const mockEquipoService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getHistorial: jest.fn(),
  getHistorialByEquipo: jest.fn(),
};

describe('EquipoController', () => {
  let controller: EquipoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipoController],
      providers: [
        {
          provide: EquipoService,
          useValue: mockEquipoService,
        },
      ],
    }).compile();

    controller = module.get<EquipoController>(EquipoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});