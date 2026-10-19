import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguracionReservasConsultasController } from './configuracion_reservas_consultas.controller';

describe('ConfiguracionReservasConsultasController', () => {
  let controller: ConfiguracionReservasConsultasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfiguracionReservasConsultasController],
    }).compile();

    controller = module.get<ConfiguracionReservasConsultasController>(
      ConfiguracionReservasConsultasController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
