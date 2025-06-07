import { Injectable } from '@nestjs/common';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class HistoryService {
  constructor (private readonly prisma: PrismaService){}
    
      create(createHistoryDto: CreateHistoryDto ) {
        return this.prisma.history.create({data:createHistoryDto});
      }
    
      findAll() {
        return this.prisma.history.findMany();
      }
    
      findOne(id: number) {
        return this.prisma.history.findUnique({where :{id:id}});
      }
    
      update(id: number, updateHistoryDto: UpdateHistoryDto) {
        return this.prisma.history.update({where : {id:id}, data: updateHistoryDto});
      }
    
      remove(id: number) {
        return this.prisma.history.delete({where :{id:id}});
      }
    }
    