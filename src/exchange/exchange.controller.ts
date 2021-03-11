import { Controller, Get, Logger, Query } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { OHLCVRequestQuery } from './models/dto/ohlcv-request-query';

@Controller('exchange')
export class ExchangeController {
  private readonly logger = new Logger(ExchangeController.name);

  constructor(private exchangeService: ExchangeService) {}

  @Get('/ohlcv')
  getOHLCV(@Query() query: OHLCVRequestQuery) {
    this.logger.debug(JSON.stringify(query));
  }
}
