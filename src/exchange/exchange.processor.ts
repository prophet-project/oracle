import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import {
  BaseExchangeResponseData,
  ExchangeRequestJob,
  ExchangeResponse,
  OHLCVRequestPayload,
} from 'src/typings';
import { ExchangeService } from './exchange.service';

export const QUEUE_NAME = 'exchange_queue';

@Processor(QUEUE_NAME)
export class ExchangeProcessor {
  constructor(private exchangeService: ExchangeService) {}

  get exchange() {
    return this.exchangeService.exchange;
  }

  @Process()
  async handleHTTPRequestJob(
    job: Job<ExchangeRequestJob<unknown>>,
  ): Promise<ExchangeResponse> {
    const { type, payload } = job.data;
    let data: BaseExchangeResponseData;
    switch (type) {
      case 'OHLCV': {
        data = await this.handleOHLCVRequest(payload as OHLCVRequestPayload);
        break;
      }
    }
    return { type, data };
  }

  handleOHLCVRequest(payload: OHLCVRequestPayload) {
    return this.exchange.fetchOHLCV(
      payload.symbol,
      payload.timeframe,
      payload.from,
      payload.limit,
    );
  }
}
