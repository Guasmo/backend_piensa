import { Injectable } from '@nestjs/common';
import { CreateConsumeDto } from './dto/create-consume.dto';
import { UpdateConsumeDto } from './dto/update-consume.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConsumeService {
  constructor (private readonly prisma: PrismaService){}
  
    create(createConsumeDto: CreateConsumeDto ) {
      return this.prisma.consume.create({data:createConsumeDto});
    }
  
    findAll() {
      return this.prisma.consume.findMany();
    }
  
    findOne(id: number) {
      return this.prisma.consume.findUnique({where :{id:id}});
    }
  
    update(id: number, updateConsumeDto: UpdateConsumeDto) {
      return this.prisma.consume.update({where : {id:id}, data: updateConsumeDto});
    }
  
    remove(id: number) {
      return this.prisma.consume.delete({where :{id:id}});
    }
  }
  