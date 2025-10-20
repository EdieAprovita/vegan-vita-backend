import {
  IsString,
  IsNumber,
  IsUUID,
  Min,
  MinLength,
  IsOptional,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsString()
  @IsUUID()
  categoryId: string;

  @IsString()
  @IsOptional()
  image?: string;
}
