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
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './realtime/realtime.module';
import { Esp32DataModule } from './esp32-data/esp32-data.module';

@Module({
  imports: [
    PrismaModule, 
    AuthModule, 
    UserModule, 
    SpeakersModule, 
    UsageSessionsModule, 
    EnergyMeasurementsModule, 
    HistoryModule, 
    UserspeakersModule, 
    RealtimeModule, 
    Esp32DataModule
  ],
  controllers: [AppController], // CORRECTO
  providers: [AppService],      // CORRECTO - Solo debe estar AppService aquí
})
export class AppModule {}