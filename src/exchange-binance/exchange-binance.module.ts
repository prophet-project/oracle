import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ExchangeModule } from 'src/exchange/exchange.module';
import { ExchangeService } from 'src/exchange/exchange.service';
import { ExchangeBinanceService, QUEUE_NAME } from './exchange-binance.service';

@Module({
  imports: [
    ExchangeModule,
    BullModule.registerQueueAsync({
      imports: [ExchangeModule],
      name: QUEUE_NAME,
      useFactory: async (exchangeService: ExchangeService) => {
        const { name, rateLimit } = exchangeService.exchange;
        exchangeService.log(
          `Initializing queue "${QUEUE_NAME}" for "${name}" [rateLimit: ${rateLimit}]..`,
        );
        return {
          name: QUEUE_NAME,
          prefix: name,
          limiter: { max: 1, duration: rateLimit },
        };
      },
      inject: [ExchangeService],
    }),
  ],
  // exports: [BullModule],
  providers: [ExchangeBinanceService],
})
export class ExchangeBinanceModule {}
