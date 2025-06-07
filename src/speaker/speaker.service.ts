import { Injectable } from '@nestjs/common';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SpeakerService {
 constructor (private readonly prisma: PrismaService){}
    
      create(createSpeakerDto: CreateSpeakerDto ) {
        return this.prisma.speaker.create({data:createSpeakerDto});
      }
    
      findAll() {
        return this.prisma.speaker.findMany();
      }
    
      findOne(id: number) {
        return this.prisma.speaker.findUnique({where :{id:id}});
      }
    
      update(id: number, updateSpeakerDto: UpdateSpeakerDto) {
        return this.prisma.speaker.update({where : {id:id}, data: updateSpeakerDto});
      }
    
      remove(id: number) {
        return this.prisma.speaker.delete({where :{id:id}});
      }
    }
    