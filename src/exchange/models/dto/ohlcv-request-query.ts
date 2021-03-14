import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsPositive } from 'class-validator';
import { Pagination } from 'src/common/models/dto/pagination';
import { TIMEFRAMES } from 'src/database/migrations/01-create-ohlcv-tables';
import { TIMEFRAME as TIMEFRAME_5M } from 'src/database/migrations/02-create-ohlcv-5m-table';
import { TIMEFRAME as TIMEFRAME_15M } from 'src/database/migrations/03-create-ohlcv-15m-table';

export class OHLCVRequestQuery extends Pagination {
  @IsNotEmpty()
  @IsIn([...TIMEFRAMES, TIMEFRAME_5M, TIMEFRAME_15M])
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
