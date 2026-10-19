import { Test, TestingModule } from '@nestjs/testing';
import { EspecialidadMedicaService } from './especialidad-medica.service';

describe('EspecialidadMedicaService', () => {
  let service: EspecialidadMedicaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EspecialidadMedicaService],
    }).compile();

    service = module.get<EspecialidadMedicaService>(EspecialidadMedicaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
