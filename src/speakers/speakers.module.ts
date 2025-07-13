import { Module } from '@nestjs/common';
import { SpeakersService } from './speakers.service';
import { SpeakersController } from './speakers.controller';

@Module({
  providers: [SpeakersService],
  controllers: [SpeakersController]
})
export class SpeakersModule {}
