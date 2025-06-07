import { Test, TestingModule } from '@nestjs/testing';
import { UserspeaakerController } from './userspeaaker.controller';
import { UserspeaakerService } from './userspeaaker.service';

describe('UserspeaakerController', () => {
  let controller: UserspeaakerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserspeaakerController],
      providers: [UserspeaakerService],
    }).compile();

    controller = module.get<UserspeaakerController>(UserspeaakerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
