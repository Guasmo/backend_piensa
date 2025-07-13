import { Module } from '@nestjs/common';
import { UserspeakersService } from './userspeakers.service';
import { UserspeakersController } from './userspeakers.controller';

@Module({
  providers: [UserspeakersService],
  controllers: [UserspeakersController]
})
export class UserspeakersModule {}
