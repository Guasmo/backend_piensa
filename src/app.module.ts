import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HistoryModule } from './history/history.module';
import { UserspeaakerModule } from './userspeaaker/userspeaaker.module';
import { UserrolModule } from './userrol/userrol.module';
import { UserModule } from './user/user.module';
import { SpeakerModule } from './speaker/speaker.module';
import { PositionModule } from './position/position.module';
import { BatteryModule } from './battery/battery.module';
import { ConsumeModule } from './consume/consume.module';

@Module({
  imports: [AuthModule, HistoryModule, BatteryModule, ConsumeModule, PositionModule, SpeakerModule, UserModule, UserrolModule, UserspeaakerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
