import { PartialType } from '@nestjs/mapped-types';
import { CreateConsumeDto } from './create-consume.dto';

export class UpdateConsumeDto extends PartialType(CreateConsumeDto) {}
