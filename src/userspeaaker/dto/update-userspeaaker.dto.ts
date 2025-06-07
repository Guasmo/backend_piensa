import { PartialType } from '@nestjs/mapped-types';
import { CreateUserspeaakerDto } from './create-userspeaaker.dto';

export class UpdateUserspeaakerDto extends PartialType(CreateUserspeaakerDto) {}
