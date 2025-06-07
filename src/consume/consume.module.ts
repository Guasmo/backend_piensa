import { Module } from '@nestjs/common';
import { ConsumeService } from './consume.service';
import { ConsumeController } from './consume.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ConsumeController],
  providers: [ConsumeService, PrismaService],
})
export class ConsumeModule {}
