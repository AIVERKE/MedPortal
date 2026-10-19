import { Test, TestingModule } from '@nestjs/testing';
import { FechaCierreService } from './fecha_cierre.service';

describe('FechaCierreService', () => {
  let service: FechaCierreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FechaCierreService],
    }).compile();

    service = module.get<FechaCierreService>(FechaCierreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
