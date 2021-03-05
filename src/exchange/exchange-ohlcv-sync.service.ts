import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bull';
import { Sequelize } from 'sequelize-typescript';
import { ExchangeRequestJob, OHLCVRequestPayload } from 'src/typings';
import { BITCOIN_LAUNCH } from './constants';
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
    }
  }

  async syncOHLCVFromTimestamp(timeframe: string, timestamp: number) {
    const { exchange } = this.exchangeService;
    const limit = 1000;
    const timeframeDurationInSeconds = exchange.parseTimeframe(timeframe);
    const timeframeDurationInMilliseconds = timeframeDurationInSeconds * 1000;
    const timeDelta = limit * timeframeDurationInMilliseconds;
    const fetchSince = timestamp - timeDelta;
    await this.getExchangeOHLCV({ timeframe, limit, from: fetchSince });
  }

  async getOlderOHLCVEntry(timeframe: string): Promise<ccxt.OHLCV | null> {
    return (
      (await this.getOlderOHLCVEntryFromDB(timeframe)) ??
      (await this.getOlderOHLCVEntryFromExchange(timeframe))
    );
  }

  async getOlderOHLCVEntryFromDB(
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

  async getOlderOHLCVEntryFromExchange(
    timeframe: string,
  ): Promise<ccxt.OHLCV | null> {
    const data = await this.getExchangeOHLCV({
      timeframe: timeframe,
      from: BITCOIN_LAUNCH,
      limit: 1,
    });
    return data.length === 0 ? null : data[0];
  }

  async getExchangeOHLCV(
    payload: Partial<OHLCVRequestPayload>,
  ): Promise<ccxt.OHLCV[]> {
    const job = await this.exchangeQueue.add({
      type: 'OHLCV',
      payload: {
        symbol: this.exchangeService.defaultSymbol,
        ...payload,
      } as OHLCVRequestPayload,
    });
    const { data } = await job.finished();
    return data;
  }
}
