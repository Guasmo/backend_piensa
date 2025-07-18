import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module'; // Ajusta la ruta según tu estructura
import { Esp32DataService } from './esp32-data.service';
import { Esp32DataController } from './esp32-data.controller';

@Module({
  imports: [PrismaModule], // Importa el módulo que contiene PrismaService
  controllers: [Esp32DataController],
  providers: [Esp32DataService],
  exports: [Esp32DataService],
})
export class Esp32DataModule {}