import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthModuleOptions, PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy],
  exports: [AuthService],
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({
      secret: "tu_clave_secreta",
      signOptions: { expiresIn: "1h"},
    }),
  ],
})
  
export class AuthModule {}
