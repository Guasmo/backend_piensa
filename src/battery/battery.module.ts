import { Module } from '@nestjs/common';
import { BatteryService } from './battery.service';
import { BatteryController } from './battery.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [BatteryController],
  providers: [BatteryService, PrismaService],
})
export class BatteryModule {}
