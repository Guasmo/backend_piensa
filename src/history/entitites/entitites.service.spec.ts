import { Test, TestingModule } from '@nestjs/testing';
import { EntititesService } from './entitites.service';

describe('EntititesService', () => {
  let service: EntititesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EntititesService],
    }).compile();

    service = module.get<EntititesService>(EntititesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
