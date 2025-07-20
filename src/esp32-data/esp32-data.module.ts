import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { Esp32DataService } from './esp32-data.service';
import { Esp32DataController } from './esp32-data.controller';

@Module({
  imports: [PrismaModule],
  controllers: [Esp32DataController],
  providers: [Esp32DataService],
  exports: [Esp32DataService], // Exportar para que otros módulos puedan usarlo
})
export class Esp32DataModule {}