import { Module } from '@nestjs/common';
import { UsageSessionsService } from './usage-sessions.service';
import { UsageSessionsController } from './usage-sessions.controller';

@Module({
  providers: [UsageSessionsService],
  controllers: [UsageSessionsController]
})
export class UsageSessionsModule {}
