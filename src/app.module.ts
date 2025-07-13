import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SpeakersModule } from './speakers/speakers.module';
import { UsageSessionsModule } from './usage-sessions/usage-sessions.module';
import { EnergyMeasurementsModule } from './energy-measurements/energy-measurements.module';
import { HistoryModule } from './history/history.module';
import { UserspeakersModule } from './userspeakers/userspeakers.module';
import { RealtimeGateway } from './realtime/realtime.gateway';

@Module({
  imports: [AuthModule, UserModule, SpeakersModule, UsageSessionsModule, EnergyMeasurementsModule, HistoryModule, UserspeakersModule],
  controllers: [AppController],
  providers: [AppService, RealtimeGateway],
})
export class AppModule {}
