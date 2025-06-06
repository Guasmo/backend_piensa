import { Module } from '@nestjs/common';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { EntitiesModule } from './entities/entities.module';
import { EntititesService } from './entitites/entitites.service';

@Module({
  controllers: [HistoryController],
  providers: [HistoryService, EntititesService],
  imports: [EntitiesModule]
})
export class HistoryModule {}
