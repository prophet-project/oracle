import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ExchangeService } from './exchange.service';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [ExchangeService],
  exports: [ExchangeService],
})
export class ExchangeModule {}
