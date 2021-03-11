import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as ccxt from 'ccxt';
import * as _ from 'lodash';
import { Sequelize } from 'sequelize-typescript';
import { getEnv } from 'src/utils/common.utils';
import OHLCVCandle from './models/ohlcv-candle';

@Injectable()
export class ExchangeService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeService.name);
  private readonly exchanges: ccxt.Exchange[];
  private readonly currentExchange: ccxt.Exchange;
  private timeframes?: string[];

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
    ) as ccxt.Exchange;
    this.logger = new Logger(
      `${ExchangeService.name} (${this.currentExchange.name})`,
    );
  }

  async onModuleInit() {
    this.log(
      `Symbol: ${this.defaultSymbol}, OHLCV request limit: ${this.limit}`,
    );
    this.log('Loading markets...');
    await this.currentExchange.loadMarkets();

    this.log('Fetching OHLCV timeframes...');
    this.timeframes = _.compact(await this.fetchOHLCVTimeframes());
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
    return getEnv(this.name.toUpperCase() + '_SYMBOL', 'BTC/USDT');
  }

  get limit(): number {
    return +getEnv(this.name.toUpperCase() + '_OHLCV_REQUEST_LIMIT', 100);
  }

  get name(): string {
    return this.exchange.name;
  }

  get supportedTimeframes(): string[] {
    return this.timeframes ?? [];
  }

  log(message: any) {
    this.logger.log(message);
  }

  getModel = _.memoize((timeframe: string) => {
    const name = 'ohlcv_' + timeframe;
    let model = this.sequelize.models[name];
    if (model) return model;
    model = this.sequelize.define(name, OHLCVCandle);
    model.removeAttribute('id');
    return model;
  });
}
