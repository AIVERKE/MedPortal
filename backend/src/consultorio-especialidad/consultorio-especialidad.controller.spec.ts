import { Test, TestingModule } from '@nestjs/testing';
import { ConsultorioEspecialidadController } from './consultorio-especialidad.controller';

describe('ConsultorioEspecialidadController', () => {
  let controller: ConsultorioEspecialidadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsultorioEspecialidadController],
    }).compile();

    controller = module.get<ConsultorioEspecialidadController>(
      ConsultorioEspecialidadController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
