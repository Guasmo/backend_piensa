import { Injectable } from '@nestjs/common';
import { CreateBatteryDto } from './dto/create-battery.dto';
import { UpdateBatteryDto } from './dto/update-battery.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BatteryService {

  constructor (private readonly prisma: PrismaService){}

  create(createBatteryDto: CreateBatteryDto) {
    return this.prisma.battery.create({data:createBatteryDto});
  }

  findAll() {
    return this.prisma.battery.findMany();
  }

  findOne(id: number) {
    return this.prisma.battery.findUnique({where :{id:id}});
  }

  update(id: number, updateBatteryDto: UpdateBatteryDto) {
    return this.prisma.battery.update({where : {id:id}, data: updateBatteryDto});
  }

  remove(id: number) {
    return this.prisma.battery.delete({where :{id:id}});
  }
}
