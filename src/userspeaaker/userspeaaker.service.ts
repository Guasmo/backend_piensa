import { Injectable } from '@nestjs/common';
import { CreateUserspeaakerDto } from './dto/create-userspeaaker.dto';
import { UpdateUserspeaakerDto } from './dto/update-userspeaaker.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserspeaakerService {
   constructor (private readonly prisma: PrismaService){}
      
        create(createUserspeaakerDto: CreateUserspeaakerDto ) {
          return this.prisma.userspeaker.create({data:createUserspeaakerDto});
        }
      
        findAll() {
          return this.prisma.userspeaker.findMany();
        }
      
        findOne(id: number) {
          return this.prisma.userspeaker.findUnique({where :{id:id}});
        }
      
        update(id: number, updateUserspeaakerDto: UpdateUserspeaakerDto) {
          return this.prisma.userspeaker.update({where : {id:id}, data: updateUserspeaakerDto});
        }
      
        remove(id: number) {
          return this.prisma.userspeaker.delete({where :{id:id}});
        }
      }
      