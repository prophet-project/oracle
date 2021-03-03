import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { QUEUE_NAME } from './exchange.processor';
import { ExchangeService } from './exchange.service';

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
  providers: [ExchangeService],
  exports: [ExchangeService],
})
export class ExchangeModule {}
