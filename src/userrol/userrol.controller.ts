import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserrolService } from './userrol.service';
import { CreateUserrolDto } from './dto/create-userrol.dto';
import { UpdateUserrolDto } from './dto/update-userrol.dto';

@Controller('userrol')
export class UserrolController {
  constructor(private readonly userrolService: UserrolService) {}

  @Post()
  create(@Body() createUserrolDto: CreateUserrolDto) {
    return this.userrolService.create(createUserrolDto);
  }

  @Get()
  findAll() {
    return this.userrolService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userrolService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserrolDto: UpdateUserrolDto) {
    return this.userrolService.update(+id, updateUserrolDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userrolService.remove(+id);
  }
}
