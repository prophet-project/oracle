import * as _ from 'lodash';
import { Sequelize, DataType } from 'sequelize-typescript';

const PREFIX = 'ohlcv';
const TIME_FRAMES = ['1m', '1h', '1d'];

export default {
  name: '01-create-ohlcv-tables',
  async up(sequelize: Sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    for (const timeFrame of TIME_FRAMES) {
      const tableName = `${PREFIX}_${timeFrame}`;
      await queryInterface.createTable(tableName, {
        timestamp: { type: DataType.INTEGER, allowNull: false, unique: true },
        open: { type: DataType.DOUBLE, allowNull: false },
        high: { type: DataType.DOUBLE, allowNull: false },
        low: { type: DataType.DOUBLE, allowNull: false },
        close: { type: DataType.DOUBLE, allowNull: false },
        volume: { type: DataType.DOUBLE, allowNull: false },
      });
      await sequelize.query(
        `SELECT create_hypertable('${tableName}', 'timestamp', chunk_time_interval => 86400000)`,
      );
    }
  },
  down(sequelize: Sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    return Promise.all(
      _.chain(TIME_FRAMES)
        .map((timeFrame) => queryInterface.dropTable(`${PREFIX}_${timeFrame}`))
        .value(),
    );
  },
};
