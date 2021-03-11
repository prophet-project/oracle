import {
  Controller,
  Get,
  Logger,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FindAndCountOptions, Op } from 'sequelize';
import { ExchangeService } from './exchange.service';
import { OHLCVRequestQuery } from './models/dto/ohlcv-request-query';

@Controller('exchange')
export class ExchangeController {
  private readonly logger = new Logger(ExchangeController.name);

  constructor(private exchangeService: ExchangeService) {}

  @Get('/ohlcv')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getOHLCV(@Query() query: OHLCVRequestQuery) {
    const model = this.exchangeService.getModel(query.tf);

    const options = {
      offset: query.offset,
      limit: query.limit,
      order: [['timestamp', query.order]],
    } as FindAndCountOptions<any>;

    const { from, to } = query;
    if (from || to) {
      const timestamp = {};
      from && Object.assign(timestamp, { [Op.gte]: query.from });
      to && Object.assign(timestamp, { [Op.lt]: query.to });
      Object.assign(options, { where: { timestamp } });
    }

    const result = await model.findAndCountAll(options);
    return result;
  }
}
