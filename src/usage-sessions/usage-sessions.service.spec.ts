import { Test, TestingModule } from '@nestjs/testing';
import { UsageSessionsService } from './usage-sessions.service';

describe('UsageSessionsService', () => {
  let service: UsageSessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsageSessionsService],
    }).compile();

    service = module.get<UsageSessionsService>(UsageSessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
