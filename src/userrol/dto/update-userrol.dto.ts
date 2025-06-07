import { PartialType } from '@nestjs/mapped-types';
import { CreateUserrolDto } from './create-userrol.dto';

export class UpdateUserrolDto extends PartialType(CreateUserrolDto) {}
