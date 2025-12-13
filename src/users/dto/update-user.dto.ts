import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { RegisterDto } from '../../auth/dto/register.dto';

export class UpdateUserDto extends PartialType(RegisterDto) {
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
