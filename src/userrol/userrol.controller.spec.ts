import { Test, TestingModule } from '@nestjs/testing';
import { UserrolController } from './userrol.controller';
import { UserrolService } from './userrol.service';

describe('UserrolController', () => {
  let controller: UserrolController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserrolController],
      providers: [UserrolService],
    }).compile();

    controller = module.get<UserrolController>(UserrolController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
