import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SpeakersService } from './speakers.service';
import { SpeakersController } from './speakers.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SpeakersController],
  providers: [SpeakersService],
  exports: [SpeakersService], // Exportar para que otros módulos puedan usarlo
})
export class SpeakersModule {}