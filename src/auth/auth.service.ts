import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ValidationDto } from './dto/Validation.dto';
import { LoginDto } from './dto/Login.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import * as bcrypt from "bcrypt"

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService, readonly prisma: PrismaService) {}
    async validateUser(usernameOrEmail: string, password: string): Promise<ValidationDto | undefined> {
        const user = await this.prisma.user.findFirst({
            where :{
                OR: [
                    {username: usernameOrEmail},
                    {email: usernameOrEmail}
                ], 
                userRol: {
                },
            }
        }); 

        if (!user) {
            return undefined;
        }
        if (await bcrypt.compare(password, user.password)){
            const {password, ...result} = user;
            return result
        }
        return undefined 
    }
    async login(data: LoginDto) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    {username: data.usernameOrEmail},
                    {email: data.usernameOrEmail}
                ],
            },
            include: {
                userRol:{
                }
            }
        });
        if (!user) {
            throw new UnauthorizedException("Credenciales invalidas");
        }
    
        const payload = {
            username: user.username,
        };
        return {
            access_token: this.jwtService.sign(payload),
        }
    }
        create(CreateUserDto: CreateUserDto) {
            return this.prisma.user.create({data: CreateUserDto});
        }
    }
