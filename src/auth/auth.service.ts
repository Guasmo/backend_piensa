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
        // Verificar si el email ya existe
        const existingUser = await this.prisma.user.findUnique({
          where: { email: CreateUserDto.email }
        });

        if (existingUser) {
          throw new Error('El usuario con ese email ya existe');
        }

        const { password, ...userDto } = CreateUserDto;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
          data: {
            ...userDto,
            password: hashedPassword,
            role: CreateUserDto.role || Role.USER, // Usar el rol del DTO o USER por defecto
          },
          select: { // No devolver la contraseña
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
          }
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
        username: true,
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
  
    const accessToken = this.getJwtToken({ id: user.id.toString(), role: roleName });
    const refreshToken = this.getJwtToken({ id: user.id.toString() });

    return {
      userId: user.id,
      username: user.username,
      roleName,
      accessToken,
      refreshToken,
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  async refreshToken(refreshDto: RefreshDto) {
    try {
      const payload = this.jwtService.verify(refreshDto.refreshToken, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });
      
      const user = await this.prisma.user.findUnique({
        where: { id: parseInt(payload.id) },
        select: { email: true, id: true, role: true, username: true },
      });

      if (!user) throw new UnauthorizedException("Invalid refresh token");
      
      const accessToken = this.getJwtToken({ id: user.id.toString(), role: user.role });
      const refreshToken = this.getJwtToken({ id: user.id.toString() });

      return {
        userId: user.id,
        username: user.username,
        roleName: user.role,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }
}