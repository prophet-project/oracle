import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExchangeModule } from './exchange/exchange.module';
import { getEnv } from './utils/common.utils';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: getEnv('REDIS_HOST'),
          port: +getEnv('REDIS_PORT'),
        },
      }),
    }),
    ExchangeModule,
  ],
})
export class AppModule {}
