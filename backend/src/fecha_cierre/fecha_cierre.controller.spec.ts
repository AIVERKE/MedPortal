import { Test, TestingModule } from '@nestjs/testing';
import { FechaCierreController } from './fecha_cierre.controller';

describe('FechaCierreController', () => {
  let controller: FechaCierreController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FechaCierreController],
    }).compile();

    controller = module.get<FechaCierreController>(FechaCierreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
