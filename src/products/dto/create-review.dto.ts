import { IsString, IsNumber, Min, Max, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Product rating (1-5 stars)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Review comment',
    example: 'Excellent product, highly recommended. Premium quality.',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  comment: string;
}
