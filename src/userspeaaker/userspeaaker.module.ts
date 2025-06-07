import { Module } from '@nestjs/common';
import { UserspeaakerService } from './userspeaaker.service';
import { UserspeaakerController } from './userspeaaker.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [UserspeaakerController],
  providers: [UserspeaakerService, PrismaService],
})
export class UserspeaakerModule {}
