import { Injectable, Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import * as Uzmug from 'umzug';

import _00_timescaledb_extension from './migrations/00-timescaledb-extension';
import _01_create_ohlcv_tables from './migrations/01-create-ohlcv-tables';
import _02_create_ohlcv_5m_table from './migrations/02-create-ohlcv-5m-table';
import _03_create_ohlcv_15m_table from './migrations/03-create-ohlcv-15m-table';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);
  private readonly umzug: Uzmug.Umzug;

  constructor(sequelize: Sequelize) {
    this.umzug = new Uzmug({
      migrations: Uzmug.migrationsList(
        [
          _00_timescaledb_extension,
          _01_create_ohlcv_tables,
          _02_create_ohlcv_5m_table,
          _03_create_ohlcv_15m_table,
        ] as any,
        [sequelize, sequelize.getQueryInterface()],
      ),
      storageOptions: { sequelize },
      storage: 'sequelize',
      logging: (...params: any[]) => {
        this.logger.log(params);
      },
    });
  }

  runMigrations = () => {
    return this.umzug.up();
  };

  revertMigrations = () => {
    return this.umzug.down({ to: 0 });
  };
}
