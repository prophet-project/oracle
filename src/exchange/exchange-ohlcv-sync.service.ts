import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bull';
import { Sequelize } from 'sequelize-typescript';
import {
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

@Injectable()
export class ExchangeOHLCVSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ExchangeOHLCVSyncService.name);

  constructor(
    @InjectQueue(QUEUE_NAME)
    private exchangeQueue: Queue<ExchangeRequestJob<OHLCVRequestPayload>>,
    private exchangeService: ExchangeService,
    private sequelize: Sequelize,
  ) {}

  async onApplicationBootstrap() {
    const { exchange } = this.exchangeService;
    const syncOrder = _.sortBy(
      this.exchangeService.supportedTimeframes,
      (timeframe) => -exchange.parseTimeframe(timeframe),
    );
    this.logger.log(
      `Preparing to OHLCV data sync [Order: ${syncOrder.join(', ')}]...`,
    );
    for (const timeframe of syncOrder) {
      const olderOHLCV = await this.getOlderOHLCVEntryFromDB(timeframe);
      const timestamp = olderOHLCV ? olderOHLCV[0] : exchange.milliseconds();
      const date = formatDate(timestamp, timeframe);
      this.logger.log(
        `Starting "${timeframe}" OHLCV data sync from ${date}...`,
      );
      await this.syncOHLCVFromTimestamp(timeframe, timestamp);
      this.logger.debug(`Syncing "${timeframe}" OHLCV data is done`);
    }
  }

  private async syncOHLCVFromTimestamp(timeframe: string, timestamp: number) {
    this.logger.debug(
      `Fetching "${timeframe}" OHLCV candles from ${formatDate(
        timestamp,
        timeframe,
      )}`,
    );
    const { exchange, limit } = this.exchangeService;
    const timeframeDurationInSeconds = exchange.parseTimeframe(timeframe);
    const timeframeDurationInMilliseconds = timeframeDurationInSeconds * 1000;
    const timeDelta = (limit - 1) * timeframeDurationInMilliseconds;
    const from = timestamp - timeDelta;
    const candles = await this.getExchangeOHLCV({ timeframe, limit, from });
    let nextSyncFrom: number;
    let message: string;
    if (candles === null) {
      nextSyncFrom = timestamp;
      message = `Retrying to fetch "${timeframe}" OHLCV data...`;
    } else {
      const oldestTimestamp = candles[0][0];
      if (candles.length === 0 || timestamp === oldestTimestamp) {
        nextSyncFrom = -1;
        message = `No "${timeframe}" OHLCV data was fetched`;
      } else {
        nextSyncFrom = oldestTimestamp;
        message = `Fetched ${candles.length} "${timeframe}" OHLCV candles`;
      }
    }
    this.logger.debug(message);
    if (nextSyncFrom >= 0) {
      await this.syncOHLCVFromTimestamp(timeframe, nextSyncFrom);
    }
  }

  private async getOlderOHLCVEntryFromDB(
    timeframe: string,
  ): Promise<ccxt.OHLCV | null> {
    const result = await this.sequelize.query(
      `SELECT * FROM ohlcv_${timeframe} ORDER BY timestamp ASC LIMIT 1`,
      {
        raw: true,
        plain: true,
      },
    );
    return result ? (_.values(result) as ccxt.OHLCV) : null;
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
}
