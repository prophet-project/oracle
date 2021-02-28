import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ExchangeHistoryService } from './exchange-history.service';
import * as cctx from 'ccxt';
import { getEnv } from 'src/utils/common.utils';

@Injectable()
export class ExchangeService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeHistoryService.name);
  private readonly binance: cctx.binance;

  constructor() {
    this.binance = new cctx.binance({
      apiKey: getEnv('BINANCE_API_KEY'),
      secret: getEnv('BINANCE_SECRET_KEY'),
      enableRateLimit: true,
    });
    this.logger = new Logger(
      `${ExchangeHistoryService.name} (${this.binance.name})`,
    );
  }

  async onModuleInit() {
    this.logger.log('Loading markets...');
    await this.binance.loadMarkets();
  }

  getExchange(): cctx.Exchange {
    return this.binance;
  }
}
