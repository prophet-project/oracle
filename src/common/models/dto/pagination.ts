import { Type } from 'class-transformer';
import { IsOptional, Max, Min } from 'class-validator';

export class Pagination {
  @IsOptional()
  @Type(() => Number)
  @Max(1000)
  @Min(1)
  limit = 100;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset = 0;
}
