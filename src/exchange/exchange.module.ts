import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ExchangeOHLCVSyncService } from './exchange-ohlcv-sync.service';
import { ExchangeProcessor, QUEUE_NAME } from './exchange.processor';
import { ExchangeService } from './exchange.service';
import { ExchangeController } from './exchange.controller';

@Global()
@Module({
  imports: [
    DatabaseModule,
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
  providers: [ExchangeService, ExchangeProcessor, ExchangeOHLCVSyncService],
  exports: [ExchangeService],
  controllers: [ExchangeController],
})
export class ExchangeModule {}
