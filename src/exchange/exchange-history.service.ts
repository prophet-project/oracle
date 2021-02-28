import { Injectable, Logger } from '@nestjs/common';
import { Interval, Timeout } from '@nestjs/schedule';
import * as cctx from 'ccxt';
import { ExchangeService } from './exchange.service';

@Injectable()
export class ExchangeHistoryService {
  private readonly logger = new Logger(ExchangeHistoryService.name);
  private readonly exchange: cctx.Exchange;

  constructor(exchangeService: ExchangeService) {
    this.exchange = exchangeService.getExchange();
  }

  @Timeout(100)
  async handleInterval() {
    const candles = await this.exchange.fetchOHLCV('BTC/USDT', '1m');
    this.logger.log(candles.length);
  }
}
