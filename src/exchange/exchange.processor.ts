import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import {
  ExchangeRequestJob,
  ExchangeResponse,
  OHLCVRequestPayload,
  OHLCVResponseData,
} from 'src/typings';
import { ExchangeService } from './exchange.service';

export const QUEUE_NAME = 'exchange_queue';

@Processor(QUEUE_NAME)
export class ExchangeProcessor {
  private readonly logger = new Logger(ExchangeProcessor.name);

  constructor(private exchangeService: ExchangeService) {}

  get exchange() {
    return this.exchangeService.exchange;
  }

  @Process()
  async handleHTTPRequestJob(
    job: Job<ExchangeRequestJob<any>>,
  ): Promise<ExchangeResponse<OHLCVResponseData | null>> {
    const { type, payload } = job.data;
    let data: OHLCVResponseData = null;
    try {
      switch (type) {
        case 'OHLCV': {
          data = await this.handleOHLCVRequest(payload as OHLCVRequestPayload);
          break;
        }
      }
    } catch (error) {
      this.logger.error(
        `Error while making "${type}" request to exchange: ${error}`,
      );
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
