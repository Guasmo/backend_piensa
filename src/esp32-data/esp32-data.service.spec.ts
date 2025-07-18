import { Test, TestingModule } from '@nestjs/testing';
import { Esp32DataService } from './esp32-data.service';

describe('Esp32DataService', () => {
  let service: Esp32DataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Esp32DataService],
    }).compile();

    service = module.get<Esp32DataService>(Esp32DataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
