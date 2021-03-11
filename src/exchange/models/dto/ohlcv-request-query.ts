import { IsIn, IsOptional } from 'class-validator';

export class OHLCVRequestQuery {
  from?: number;
  to?: number;
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: string;
}
