import { Test, TestingModule } from '@nestjs/testing';
import { EnergyMeasurementsService } from './energy-measurements.service';

describe('EnergyMeasurementsService', () => {
  let service: EnergyMeasurementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnergyMeasurementsService],
    }).compile();

    service = module.get<EnergyMeasurementsService>(EnergyMeasurementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
