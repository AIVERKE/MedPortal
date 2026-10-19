import { Test, TestingModule } from '@nestjs/testing';
import { PostasMedicasService } from './postas-medicas.service';

describe('PostasMedicasService', () => {
  let service: PostasMedicasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostasMedicasService],
    }).compile();

    service = module.get<PostasMedicasService>(PostasMedicasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
