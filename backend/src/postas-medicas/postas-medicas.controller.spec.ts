import { Test, TestingModule } from '@nestjs/testing';
import { PostasMedicasController } from './postas-medicas.controller';

describe('PostasMedicasController', () => {
  let controller: PostasMedicasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostasMedicasController],
    }).compile();

    controller = module.get<PostasMedicasController>(PostasMedicasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
