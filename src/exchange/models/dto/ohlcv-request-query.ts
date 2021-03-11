import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';
import { Pagination } from 'src/common/models/dto/pagination';
import { TIME_FRAMES } from 'src/database/migrations/01-create-ohlcv-tables';

export class OHLCVRequestQuery extends Pagination {
  @IsNotEmpty()
  @IsIn(TIME_FRAMES)
  tf!: string;

  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  from?: number;

  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  to?: number;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order = 'ASC';
}
