import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as ccxt from 'ccxt';
import * as _ from 'lodash';
import { Sequelize } from 'sequelize-typescript';
import { getEnv } from 'src/utils/common.utils';

@Injectable()
export class ExchangeService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeService.name);
  private readonly exchanges: ccxt.Exchange[];
  private readonly currentExchange: ccxt.Exchange;
  private timeframes: string[];

  constructor(private sequelize: Sequelize) {
    this.exchanges = [
      new ccxt.bitfinex2({
        apiKey: getEnv('BINANCE_API_KEY'),
        secret: getEnv('BINANCE_SECRET_KEY'),
        enableRateLimit: true,
      }),
      new ccxt.binance({
        apiKey: getEnv('BITFINEX_API_KEY'),
        secret: getEnv('BITFINEX_SECRET_KEY'),
        enableRateLimit: true,
      }),
    ];
    this.currentExchange = this.exchanges.find(
      (exchange) =>
        exchange.name.toLowerCase() ===
        getEnv('SELECTED_EXCHANGE').toLowerCase(),
    );
    this.logger = new Logger(
      `${ExchangeService.name} (${this.currentExchange.name})`,
    );
  }

  async onModuleInit() {
    this.log('Loading markets...');
    await this.currentExchange.loadMarkets();

    this.log('Fetching OHLCV timeframes...');
    this.timeframes = await this.fetchOHLCVTimeframes();

    console.log(this.exchange.parseTimeframe('1m'));
  }

  async fetchOHLCVTimeframes() {
    const queryInterface = this.sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    const timeframes = _.chain(tables)
      .filter((tableName) => tableName.startsWith('ohlcv_'))
      .map((tableName) => tableName.split('_').pop())
      .value();
    this.log(`Supported OHLCV timeframes: ${timeframes.join(', ')}`);
    return timeframes;
  }

  get exchange(): ccxt.Exchange {
    return this.currentExchange;
  }

  get defaultSymbol(): string {
    return getEnv(this.exchange.name.toUpperCase() + '_SYMBOL', 'BTC/USDT');
  }

  get supportedTimeframes(): string[] {
    return this.timeframes;
  }

  log(message: any) {
    this.logger.log(message);
  }
}
