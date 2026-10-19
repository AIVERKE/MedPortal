import { Test, TestingModule } from '@nestjs/testing';
import { ReservasPacientesService } from './reservas-pacientes.service';

describe('ReservasPacientesService', () => {
  let service: ReservasPacientesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReservasPacientesService],
    }).compile();

    service = module.get<ReservasPacientesService>(ReservasPacientesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
