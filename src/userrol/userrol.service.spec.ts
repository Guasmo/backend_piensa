import { Test, TestingModule } from '@nestjs/testing';
import { UserrolService } from './userrol.service';

describe('UserrolService', () => {
  let service: UserrolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserrolService],
    }).compile();

    service = module.get<UserrolService>(UserrolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
