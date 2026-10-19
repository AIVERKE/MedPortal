import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguracionReservasConsultasService } from './configuracion_reservas_consultas.service';

describe('ConfiguracionReservasConsultasService', () => {
  let service: ConfiguracionReservasConsultasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfiguracionReservasConsultasService],
    }).compile();

    service = module.get<ConfiguracionReservasConsultasService>(
      ConfiguracionReservasConsultasService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
