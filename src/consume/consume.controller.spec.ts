import { Test, TestingModule } from '@nestjs/testing';
import { ConsumeController } from './consume.controller';
import { ConsumeService } from './consume.service';

describe('ConsumeController', () => {
  let controller: ConsumeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsumeController],
      providers: [ConsumeService],
    }).compile();

    controller = module.get<ConsumeController>(ConsumeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
