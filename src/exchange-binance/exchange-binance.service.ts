import { InjectQueue, Process, Processor } from '@nestjs/bull';
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Job, Queue } from 'bull';
import { ExchangeJobPayload, ExchangeJobResult, TimeFrame } from 'src/typings';
import { ExchangeService } from 'src/exchange/exchange.service';
import * as ccxt from 'ccxt';
import { stringDurationToMilliseconds } from 'src/utils/common.utils';

export const QUEUE_NAME = 'exchange_queue';
const ALLOWED_TIMEFRAMES = ['1m', '1h', '1d'];
const DEFAULT_MARKET_SYMBOL = 'BTC/USDT';

@Injectable()
@Processor(QUEUE_NAME)
export class ExchangeBinanceService
  implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ExchangeBinanceService.name);

  constructor(
    @InjectQueue(QUEUE_NAME)
    private exchangeQueue: Queue<ExchangeJobPayload>,
    private exchangeService: ExchangeService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async onApplicationBootstrap() {
    const timeframes = Object.keys(
      this.exchange.timeframes,
    ).filter((timeFrame) => ALLOWED_TIMEFRAMES.includes(timeFrame));
    const durations = timeframes.map(stringDurationToMilliseconds);
    console.log(durations);
    timeframes.forEach((timeFrame, index) => {
      const duration = durations[index];
      const milliseconds = Math.max(duration / 6, this.exchange.rateLimit);
      const interval = setInterval(
        () => this.updateOHLCVData(timeFrame as TimeFrame),
        milliseconds,
      );
      const name = `${this.exchange.name}_${timeFrame}`;
      this.schedulerRegistry.addInterval(name, interval);
    });
  }

  onApplicationShutdown() {
    const intervals = this.schedulerRegistry.getIntervals();
    intervals.forEach((interval) => {
      interval.startsWith(this.exchange.name) &&
        this.schedulerRegistry.deleteInterval(interval);
    });
  }

  async saveOHLCVData(timeFrame: TimeFrame, data: ccxt.OHLCV[]) {
    return;
  }

  async updateOHLCVData(timeFrame: TimeFrame) {
    this.logger.debug(`Updating "${timeFrame}" data...`);
    const job = await this.exchangeQueue.add({
      timeFrame: timeFrame,
      symbol: DEFAULT_MARKET_SYMBOL,
    });
    const { data } = (await job.finished()) as ExchangeJobResult;
    await this.saveOHLCVData(timeFrame, data);
  }

  @Process()
  async handleOHLCVRequest(
    job: Job<ExchangeJobPayload>,
  ): Promise<ExchangeJobResult> {
    const { timeFrame, symbol, from, limit } = job.data;
    const data = await this.exchange.fetchOHLCV(symbol, timeFrame, from, limit);
    return { data };
  }

  get exchange() {
    return this.exchangeService.exchange;
  }
}
