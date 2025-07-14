import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { PrismaModule } from '../prisma/prisma.module'; // Importa PrismaModule si no es global

@Module({
  imports: [PrismaModule], // Añade PrismaModule aquí
  providers: [RealtimeGateway],
})
export class RealtimeModule {}