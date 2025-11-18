import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { RegisterDto } from '../../auth/dto/register.dto';

export class UpdateUserDto extends PartialType(RegisterDto) {
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
