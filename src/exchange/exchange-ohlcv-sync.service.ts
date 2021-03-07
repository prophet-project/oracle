import { InjectQueue } from '@nestjs/bull';
import {
  BeforeApplicationShutdown,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Queue } from 'bull';
import { Sequelize } from 'sequelize-typescript';
import {
  DataSyncType,
  ExchangeRequestJob,
  ExchangeResponse,
  OHLCVRequestPayload,
  OHLCVResponseData,
} from 'src/typings';
import { QUEUE_NAME } from './exchange.processor';
import { ExchangeService } from './exchange.service';
import * as ccxt from 'ccxt';
import * as _ from 'lodash';
import { formatDate } from 'src/utils/data.utils';
import OHLCVCandle, {
  createOHLCVCandle,
  parseOHLCVCandle,
} from './models/ohlcv-candle';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class ExchangeOHLCVSyncService
  implements OnApplicationBootstrap, BeforeApplicationShutdown {
  private readonly logger = new Logger(ExchangeOHLCVSyncService.name);

  constructor(
    @InjectQueue(QUEUE_NAME)
    private exchangeQueue: Queue<ExchangeRequestJob<OHLCVRequestPayload>>,
    private schedulerRegistry: SchedulerRegistry,
    private exchangeService: ExchangeService,
    private sequelize: Sequelize,
  ) {}

  async onApplicationBootstrap() {
    await this.syncOHLCVData('OLDER');
    await this.syncOHLCVData('NEWER');

    this.startSyncingRecentOHLCVData();
  }

  beforeApplicationShutdown() {
    const intervals = this.schedulerRegistry.getIntervals();
    for (const name of intervals) {
      this.schedulerRegistry.deleteInterval(name);
      this.logger.log(`Interval "${name}" was deleted`);
    }
  }

  private async startSyncingRecentOHLCVData() {
    const syncOrder = this.exchangeService.supportedTimeframes;
    this.logger.log(
      `Starting to sync recent OHLCV data [Order: ${syncOrder.join(', ')}]...`,
    );
    syncOrder.forEach((timeframe) => {
      const duration = this.getTimeframeDuration(timeframe);
      const milliseconds = Math.max(duration / 10, 10000);
      const interval = setInterval(
        () => this.syncRecentOHLCVDataBy(timeframe, milliseconds),
        milliseconds,
      );
      this.schedulerRegistry.addInterval(`${timeframe}_ohlcv_update`, interval);
      this.logger.debug(
        `Interval for "${timeframe}" update was created [milliseconds: ${milliseconds}]`,
      );
    });
  }

  private async syncRecentOHLCVDataBy(timeframe: string, timeout?: number) {
    const newestOHLCV = await this.getNewestOHLCVEntryFromDB(timeframe);
    if (!newestOHLCV) {
      throw new Error(`There is no "${timeframe}" OHLCV data in database`);
    }
    const from = newestOHLCV[0];
    const date = formatDate(from, timeframe);
    this.logger.log(
      `Starting to sync recent "${timeframe}" OHLCV data from ${date}...`,
    );
    const { limit } = this.exchangeService;
    const candles = await this.getExchangeOHLCV({
      timeframe,
      limit,
      from,
      timeout,
    });
    if (candles !== null && candles.length > 0) {
      await this.handleFetchedOHLCVEntries(candles, timeframe, newestOHLCV);
    }
  }

  private async syncOHLCVData(syncType: DataSyncType) {
    const { exchange } = this.exchangeService;
    const syncOrder = _.sortBy(
      this.exchangeService.supportedTimeframes,
      (timeframe) => -exchange.parseTimeframe(timeframe),
    );
    const stringifyOrder = syncOrder.join(', ');
    this.logger.log(
      `Preparing to OHLCV data sync [Type: ${syncType}], [Order: ${stringifyOrder}]...`,
    );
    for (const timeframe of syncOrder) {
      const edgeOHLCV = await this.getEdgeOHLCVEntryFromDB(timeframe, syncType);
      if (syncType === 'NEWER' && !edgeOHLCV) {
        throw new Error(`There is no "${timeframe}" OHLCV data in database`);
      }
      const timestamp = edgeOHLCV ? edgeOHLCV[0] : exchange.milliseconds();
      const date = formatDate(timestamp, timeframe);
      this.logger.log(
        `Starting to sync ${syncType.toLowerCase()} "${timeframe}" OHLCV data from ${date}...`,
      );
      await this.syncOHLCVFromTimestamp(timeframe, timestamp, syncType);
      this.logger.debug(`Syncing "${timeframe}" OHLCV data is done`);
    }
  }

  private async syncOHLCVFromTimestamp(
    timeframe: string,
    syncFrom: number | ccxt.OHLCV,
    syncType: DataSyncType,
  ) {
    const { limit } = this.exchangeService;
    const timestamp = typeof syncFrom === 'number' ? syncFrom : syncFrom[0];
    this.logger.debug(
      `Fetching ${syncType.toLowerCase()} "${timeframe}" OHLCV candles from ${formatDate(
        timestamp,
        timeframe,
      )}`,
    );

    let from: number;
    switch (syncType) {
      case 'OLDER': {
        const timeframeDuration = this.getTimeframeDuration(timeframe);
        const timeDelta = (limit - 1) * timeframeDuration;
        from = timestamp - timeDelta;
        break;
      }
      case 'NEWER':
        from = timestamp;
        break;
    }

    const candles = await this.getExchangeOHLCV({ timeframe, limit, from });
    let nextSyncFrom: number | ccxt.OHLCV | null;
    let message: string;
    if (candles === null) {
      nextSyncFrom = syncFrom;
      message = `Retrying to fetch ${syncType.toLowerCase()} "${timeframe}" OHLCV data...`;
    } else {
      const edgeCandle = candles[syncType === 'OLDER' ? 0 : candles.length - 1];
      const isEqual =
        typeof syncFrom === 'number'
          ? timestamp === edgeCandle[0]
          : _.isEqual(edgeCandle, syncFrom);
      if (candles.length === 0 || isEqual) {
        nextSyncFrom = null;
        message = `No "${timeframe}" OHLCV data was fetched`;
      } else {
        nextSyncFrom = edgeCandle;
        message = `Fetched ${candles.length} "${timeframe}" OHLCV candles`;
      }
    }
    this.logger.debug(message);

    if (candles !== null) {
      const fromCandle = typeof syncFrom === 'number' ? null : syncFrom;
      await this.handleFetchedOHLCVEntries(candles, timeframe, fromCandle);
    }

    if (nextSyncFrom !== null) {
      await this.syncOHLCVFromTimestamp(timeframe, nextSyncFrom, syncType);
    }
  }

  private async handleFetchedOHLCVEntries(
    candles: ccxt.OHLCV[],
    timeframe: string,
    fetchedFrom: ccxt.OHLCV | null,
  ) {
    if (fetchedFrom !== null) {
      candles = this.removeDuplicatedCandle(candles, fetchedFrom, timeframe);
    }
    if (candles.length === 0) return;

    const array = candles.map(createOHLCVCandle);
    this.logger.debug(`Saving ${array.length} "${timeframe}" OHLCV...`);
    const model = this.getModel(timeframe);
    const result = await model.bulkCreate(array, {
      updateOnDuplicate: ['timestamp'],
    });
    this.logger.debug(`Saved ${result.length} "${timeframe}" OHLCV candles`);
  }

  private removeDuplicatedCandle(
    candles: ccxt.OHLCV[],
    targetCandle: ccxt.OHLCV,
    timeframe: string,
  ): ccxt.OHLCV[] {
    const duration = this.getTimeframeDuration(timeframe);
    const [targetTimestamp, ...restTargetData] = targetCandle;
    return _.reject(candles, (candle: ccxt.OHLCV) => {
      const [timestamp, ...restData] = candle;
      const withinRange = Math.abs(targetTimestamp - timestamp) < duration;
      return withinRange && _.isEqual(restData, restTargetData);
    });
  }

  private getNewestOHLCVEntryFromDB(
    timeframe: string,
  ): Promise<ccxt.OHLCV | null> {
    return this.getEdgeOHLCVEntryFromDB(timeframe, 'NEWER');
  }

  private async getEdgeOHLCVEntryFromDB(
    timeframe: string,
    type: DataSyncType,
  ): Promise<ccxt.OHLCV | null> {
    const model = this.getModel(timeframe);
    const result = await model.findOne({
      raw: true,
      plain: true,
      order: [['timestamp', type === 'OLDER' ? 'ASC' : 'DESC']],
    });
    return result ? parseOHLCVCandle(result) : null;
  }

  private async getExchangeOHLCV(
    payload: Partial<OHLCVRequestPayload>,
  ): Promise<OHLCVResponseData> {
    const job = await this.exchangeQueue.add({
      type: 'OHLCV',
      payload: {
        symbol: this.exchangeService.defaultSymbol,
        ...payload,
      } as OHLCVRequestPayload,
    });
    const {
      data,
    } = (await job.finished()) as ExchangeResponse<OHLCVResponseData>;
    return data;
  }

  getTimeframeDuration = _.memoize((timeframe: string) => {
    const { exchange } = this.exchangeService;
    const durationInSeconds = exchange.parseTimeframe(timeframe);
    return durationInSeconds * 1000;
  });

  getModel = _.memoize((timeframe: string) => {
    const name = 'ohlcv_' + timeframe;
    let model = this.sequelize.models[name];
    if (model) return model;
    model = this.sequelize.define(name, OHLCVCandle);
    model.removeAttribute('id');
    return model;
  });
}
