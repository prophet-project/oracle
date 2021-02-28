import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExchangeModule } from './exchange/exchange.module';

@Module({
  imports: [ScheduleModule.forRoot(), ExchangeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
