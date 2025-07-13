import { Test, TestingModule } from '@nestjs/testing';
import { UsageSessionsController } from './usage-sessions.controller';

describe('UsageSessionsController', () => {
  let controller: UsageSessionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsageSessionsController],
    }).compile();

    controller = module.get<UsageSessionsController>(UsageSessionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
