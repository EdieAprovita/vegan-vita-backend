import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'La dirección es requerida' })
  @MinLength(5, { message: 'La dirección debe tener al menos 5 caracteres' })
  @MaxLength(255, { message: 'La dirección no puede exceder 255 caracteres' })
  address: string;

  @IsString()
  @IsNotEmpty({ message: 'La ciudad es requerida' })
  @MinLength(2, { message: 'La ciudad debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'La ciudad no puede exceder 100 caracteres' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'El código postal es requerido' })
  @Matches(/^[0-9A-Za-z\s-]{3,10}$/, {
    message:
      'El código postal debe tener entre 3 y 10 caracteres alfanuméricos',
  })
  postalCode: string;

  @IsString()
  @IsNotEmpty({ message: 'El país es requerido' })
  @MinLength(2, { message: 'El país debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El país no puede exceder 100 caracteres' })
  country: string;
}
