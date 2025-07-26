import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/Login.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { JwtPayload } from './interfaces';
import { RefreshDto } from './dto/refreshDto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
      private readonly jwtService: JwtService,
      private readonly prisma: PrismaService,
      private readonly configService: ConfigService
    ) { }

    async register(CreateUserDto: CreateUserDto) {
      try {
        const { password, ...userDto } = CreateUserDto;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
          data: {
            ...userDto,
            password: hashedPassword,
            role: Role.USER, // Asignar un rol por defecto
          },
        });

        return user;

      } catch (error) {
          throw new Error(`Error al crear el usuario: ${error.message}`);
      }
    }

  async login(loginDto: LoginDto) {
    const { password, usernameOrEmail } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: usernameOrEmail },
          { username: usernameOrEmail }
        ],
      },
      select: {
        id: true,
        password: true,
        email: true,
        username: true, // <-- AÑADIDO: Necesitamos el username para el token
        role: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException("Las credenciales no son válidas");
    }
    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException("Las credenciales no son válidas");
    }

    const roleName = user.role;
  
    const accessToken = this.getJwtToken(
      { id: user.id.toString(), role: roleName},
      { expiresIn: "2d" },
    );
    const refreshToken = this.getJwtToken({ id: user.id.toString() }, { expiresIn: "7d" });

    return {
      userId: user.id,
      username: user.username, // <-- AÑADIDO: Devolvemos el username en la respuesta
      roleName,
      accessToken,
      refreshToken,
    };
  }


  private getJwtToken(payload: JwtPayload, options?: { expiresIn: string }) {
    const token = this.jwtService.sign(payload, options);
    return token;
  }
  async refreshToken(refreshDto: RefreshDto) {
    try {
      const payload = this.jwtService.verify(refreshDto.refreshToken, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
        select: { email: true, password: true, id: true },
      });

      if (!user) throw new UnauthorizedException("Invalid refresh token");
      const accessToken = this.getJwtToken(
        { id: user.id.toString() },
        { expiresIn: "2d" },
      );
      const refreshToken = this.getJwtToken(
        { id: user.id.toString() },
        { expiresIn: "7d" },
      );

      return {
        ...user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }
}
