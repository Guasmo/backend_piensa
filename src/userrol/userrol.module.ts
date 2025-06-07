import { Module } from '@nestjs/common';
import { UserrolService } from './userrol.service';
import { UserrolController } from './userrol.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [UserrolController],
  providers: [UserrolService, PrismaService],
})
export class UserrolModule {}
