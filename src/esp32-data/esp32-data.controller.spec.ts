import { Test, TestingModule } from '@nestjs/testing';
import { Esp32DataController } from './esp32-data.controller';

describe('Esp32DataController', () => {
  let controller: Esp32DataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Esp32DataController],
    }).compile();

    controller = module.get<Esp32DataController>(Esp32DataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
