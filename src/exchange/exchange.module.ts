import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ExchangeHistoryService } from './exchange-history.service';
import { ExchangeService } from './exchange.service';

@Module({
  imports: [DatabaseModule],
  providers: [ExchangeService, ExchangeHistoryService],
})
export class ExchangeModule {}
