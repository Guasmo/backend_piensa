import { Test, TestingModule } from '@nestjs/testing';
import { EnergyMeasurementsController } from './energy-measurements.controller';

describe('EnergyMeasurementsController', () => {
  let controller: EnergyMeasurementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnergyMeasurementsController],
    }).compile();

    controller = module.get<EnergyMeasurementsController>(EnergyMeasurementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
