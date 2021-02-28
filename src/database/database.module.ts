import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MigrationService } from './migration.service';
import { SequelizeConfigService } from './sequelize-config.service';

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useClass: SequelizeConfigService,
    }),
  ],
  providers: [MigrationService],
})
export class DatabaseModule {
  constructor(private migrationService: MigrationService) {}

  async onModuleInit(): Promise<void> {
    await this.migrationService.runMigrations();
  }
}
