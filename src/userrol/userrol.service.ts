import { Injectable } from '@nestjs/common';
import { CreateUserrolDto } from './dto/create-userrol.dto';
import { UpdateUserrolDto } from './dto/update-userrol.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserrolService {
  constructor (private readonly prisma: PrismaService){}
      
        create(createUserrolrDto: CreateUserrolDto ) {
          return this.prisma.userRol.create({data:createUserrolrDto});
        }
      
        findAll() {
          return this.prisma.userRol.findMany();
        }
      
        findOne(id: number) {
          return this.prisma.userRol.findUnique({where :{id:id}});
        }
      
        update(id: number, updateUserrolDto: UpdateUserrolDto) {
          return this.prisma.userRol.update({where : {id:id}, data: updateUserrolDto});
        }
      
        remove(id: number) {
          return this.prisma.userRol.delete({where :{id:id}});
        }
      }
      