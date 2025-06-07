import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserspeaakerService } from './userspeaaker.service';
import { CreateUserspeaakerDto } from './dto/create-userspeaaker.dto';
import { UpdateUserspeaakerDto } from './dto/update-userspeaaker.dto';

@Controller('userspeaaker')
export class UserspeaakerController {
  constructor(private readonly userspeaakerService: UserspeaakerService) {}

  @Post()
  create(@Body() createUserspeaakerDto: CreateUserspeaakerDto) {
    return this.userspeaakerService.create(createUserspeaakerDto);
  }

  @Get()
  findAll() {
    return this.userspeaakerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userspeaakerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserspeaakerDto: UpdateUserspeaakerDto) {
    return this.userspeaakerService.update(+id, updateUserspeaakerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userspeaakerService.remove(+id);
  }
}
