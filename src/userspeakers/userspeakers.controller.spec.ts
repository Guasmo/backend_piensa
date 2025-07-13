import { Test, TestingModule } from '@nestjs/testing';
import { UserspeakersController } from './userspeakers.controller';

describe('UserspeakersController', () => {
  let controller: UserspeakersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserspeakersController],
    }).compile();

    controller = module.get<UserspeakersController>(UserspeakersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
