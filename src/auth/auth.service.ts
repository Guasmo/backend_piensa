import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ValidationDto } from './dto/Validation.dto';
import { LoginDto } from './dto/Login.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService, readonly prisma: PrismaService) {}

  async validateUser(usernameOrEmail: string, password: string): Promise<ValidationDto | undefined> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail },
        ],
      },
      include: {
        userRol: true,
      },
    });

    if (!user) return undefined;

    if (await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }

    return undefined;
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: data.usernameOrEmail },
          { email: data.usernameOrEmail },
        ],
      },
      include: {
        userRol: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const passwordValida = await bcrypt.compare(data.password, user.password);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.userRol?.id ?? '1',
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const defaultRole = await this.prisma.userRol.findFirst({
      where: { id: 1 }, // Buscar por descripción
    });

    if (!defaultRole) {
      throw new Error('Rol "USER" no existe.');
    }

    // Exclude 'id' from createUserDto to avoid passing it explicitly
    const { id, ...userData } = createUserDto as any;

    return this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        userRol: {
          connect: { id: defaultRole.id },
        },
      },
    });
  }
}
