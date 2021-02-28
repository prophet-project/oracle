import { Injectable, Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import * as Uzmug from 'umzug';

import _00_timescaledb_extension from './migrations/00-timescaledb-extension';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);
  private readonly umzug: Uzmug.Umzug;

  constructor(private sequelize: Sequelize) {
    this.umzug = new Uzmug({
      migrations: Uzmug.migrationsList([_00_timescaledb_extension] as any, [
        sequelize,
        sequelize.getQueryInterface(),
      ]),
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
