import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShippingAddressDto {
  @ApiProperty({
    description: 'Full name of the recipient',
    example: 'John Doe',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  fullName: string;

  @ApiProperty({
    description: 'Shipping address',
    example: '123 Main Street',
    minLength: 5,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  @MinLength(5, { message: 'Address must be at least 5 characters long' })
  @MaxLength(255, { message: 'Address cannot exceed 255 characters' })
  address: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  @MinLength(2, { message: 'City must be at least 2 characters long' })
  @MaxLength(100, { message: 'City cannot exceed 100 characters' })
  city: string;

  @ApiProperty({
    description: 'Postal code',
    example: '10001',
    pattern: '^[0-9A-Za-z\\s-]{3,10}$',
  })
  @IsString()
  @IsNotEmpty({ message: 'Postal code is required' })
  @Matches(/^[0-9A-Za-z\s-]{3,10}$/, {
    message: 'Postal code must be between 3 and 10 alphanumeric characters',
  })
  postalCode: string;

  @ApiProperty({
    description: 'Country',
    example: 'United States',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  @MinLength(2, { message: 'Country must be at least 2 characters long' })
  @MaxLength(100, { message: 'Country cannot exceed 100 characters' })
  country: string;

  @ApiPropertyOptional({
    description: 'Phone number (optional)',
    example: '+1 555 123 4567',
    pattern: '^\\+?[\\d\\s-()]{8,20}$',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[\d\s-()]{8,20}$/, {
    message: 'Phone number must have a valid format',
  })
  phone?: string;
}
