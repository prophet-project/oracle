import { Injectable, Logger } from '@nestjs/common';
import {
  SequelizeModuleOptions,
  SequelizeOptionsFactory,
} from '@nestjs/sequelize';
import { getEnv } from 'src/utils/common.utils';

@Injectable()
export class SequelizeConfigService implements SequelizeOptionsFactory {
  private readonly logger = new Logger('Database');
  private readonly logLimit = 748;

  createSequelizeOptions(
    connectionName?: string,
  ): SequelizeModuleOptions | Promise<SequelizeModuleOptions> {
    this.logger.log(
      `Create sequelize options [connectionName: ${connectionName ?? '-'}]`,
    );
    return {
      dialect: 'postgres',
      host: getEnv('POSTGRES_HOST', 'localhost'),
      port: +getEnv('POSTGRES_PORT', 5432),
      username: getEnv('POSTGRES_USER'),
      password: getEnv('POSTGRES_PASSWORD'),
      database: getEnv('POSTGRES_DB'),
      autoLoadModels: true,
      synchronize: true,
      define: {
        freezeTableName: true,
        createdAt: false,
        updatedAt: false,
        timestamps: false,
      },
      logging: (sql) => {
        if (sql.length > this.logLimit) {
          sql = sql.substring(0, this.logLimit);
          sql += '...';
        }
        this.logger.debug(sql);
      },
    };
  }
}
