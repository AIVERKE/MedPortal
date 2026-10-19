import { Test, TestingModule } from '@nestjs/testing';
import { ReservasPacientesController } from './reservas-pacientes.controller';

describe('ReservasPacientesController', () => {
  let controller: ReservasPacientesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservasPacientesController],
    }).compile();

    controller = module.get<ReservasPacientesController>(
      ReservasPacientesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
