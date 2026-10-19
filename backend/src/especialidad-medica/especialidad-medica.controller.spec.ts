import { Test, TestingModule } from '@nestjs/testing';
import { EspecialidadMedicaController } from './especialidad-medica.controller';

describe('EspecialidadMedicaController', () => {
  let controller: EspecialidadMedicaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EspecialidadMedicaController],
    }).compile();

    controller = module.get<EspecialidadMedicaController>(
      EspecialidadMedicaController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
