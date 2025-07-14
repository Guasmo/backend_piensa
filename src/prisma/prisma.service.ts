import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    // Este método es llamado automáticamente por NestJS cuando el módulo se inicializa.
    // Aquí nos conectamos a la base de datos.
    await this.$connect();
    console.log('Conectado a la base de datos.');
  }

  async onModuleDestroy() {
    // Este método es llamado cuando la aplicación se apaga (ej: por `enableShutdownHooks`).
    // Asegura que la conexión a la base de datos se cierre correctamente.
    await this.$disconnect();
    console.log('Desconectado de la base de datos.');
  }
} 