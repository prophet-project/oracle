import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExchangeModule } from './exchange/exchange.module';
import { getEnv } from './utils/common.utils';
import { ExchangeBinanceModule } from './exchange-binance/exchange-binance.module';

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
    ExchangeBinanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
