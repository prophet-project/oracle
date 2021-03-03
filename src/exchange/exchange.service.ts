import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as ccxt from 'ccxt';
import { getEnv } from 'src/utils/common.utils';

@Injectable()
export class ExchangeService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeService.name);
  private readonly binance: ccxt.binance;

  constructor() {
    this.binance = new ccxt.binance({
      apiKey: getEnv('BINANCE_API_KEY'),
      secret: getEnv('BINANCE_SECRET_KEY'),
      enableRateLimit: true,
    });
    this.logger = new Logger(`${ExchangeService.name} (${this.binance.name})`);
  }

  async onModuleInit() {
    this.log('Loading markets...');
    await this.binance.loadMarkets();
  }

  get exchange(): ccxt.Exchange {
    return this.binance;
  }

  log(message: any) {
    this.logger.log(message);
  }
}
