import { IsString, IsNumber, Min, Max, MinLength } from 'class-validator';

export class CreateReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MinLength(10)
  comment: string;
}
