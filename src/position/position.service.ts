import { Injectable } from '@nestjs/common';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PositionService {
  constructor (private readonly prisma: PrismaService){}
      
        create(createPositionDto: CreatePositionDto ) {
          return this.prisma.position.create({data:createPositionDto});
        }
      
        findAll() {
          return this.prisma.position.findMany();
        }
      
        findOne(id: number) {
          return this.prisma.position.findUnique({where :{id:id}});
        }
      
        update(id: number, updatePositionDto: UpdatePositionDto) {
          return this.prisma.position.update({where : {id:id}, data: updatePositionDto});
        }
      
        remove(id: number) {
          return this.prisma.position.delete({where :{id:id}});
        }
      }
      