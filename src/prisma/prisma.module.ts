import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService], // Declara el servicio como un proveedor dentro de este módulo.
  exports: [PrismaService],   // Exporta el servicio para que otros módulos puedan usarlo.
})
export class PrismaModule {}