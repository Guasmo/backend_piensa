import { Test, TestingModule } from '@nestjs/testing';
import { UserspeakersService } from './userspeakers.service';

describe('UserspeakersService', () => {
  let service: UserspeakersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserspeakersService],
    }).compile();

    service = module.get<UserspeakersService>(UserspeakersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
