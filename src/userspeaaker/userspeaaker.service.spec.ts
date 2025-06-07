import { Test, TestingModule } from '@nestjs/testing';
import { UserspeaakerService } from './userspeaaker.service';

describe('UserspeaakerService', () => {
  let service: UserspeaakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserspeaakerService],
    }).compile();

    service = module.get<UserspeaakerService>(UserspeaakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
