import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as ccxt from 'ccxt';
import * as _ from 'lodash';
import { Sequelize } from 'sequelize-typescript';
import { getEnv } from 'src/utils/common.utils';

@Injectable()
export class ExchangeService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeService.name);
  private readonly binance: ccxt.binance;

  constructor(private sequelize: Sequelize) {
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

    this.log('Fetching OHLCV timeframes...');
    await this.prepareOHLCVTables();
  }

  async prepareOHLCVTables() {
    const queryInterface = this.sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    const timeFrames = _.chain(tables)
      .filter((tableName) => tableName.startsWith('ohlcv_'))
      .map((tableName) => tableName.split('_').pop())
      .value();
    this.log(`Active OHLCV timeframes: ${timeFrames.join(', ')}`);
  }

  get exchange(): ccxt.Exchange {
    return this.binance;
  }

  get defaultSymbol(): string {
    return 'BTC/USDT';
  }

  log(message: any) {
    this.logger.log(message);
  }
}
