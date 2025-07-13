import { Module } from '@nestjs/common';
import { EnergyMeasurementsService } from './energy-measurements.service';
import { EnergyMeasurementsController } from './energy-measurements.controller';

@Module({
  providers: [EnergyMeasurementsService],
  controllers: [EnergyMeasurementsController]
})
export class EnergyMeasurementsModule {}
