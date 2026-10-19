import { Test, TestingModule } from '@nestjs/testing';
import { ConsultorioEspecialidadService } from './consultorio-especialidad.service';

describe('ConsultorioEspecialidadService', () => {
  let service: ConsultorioEspecialidadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsultorioEspecialidadService],
    }).compile();

    service = module.get<ConsultorioEspecialidadService>(
      ConsultorioEspecialidadService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
