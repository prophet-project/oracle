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
        timestamp: { type: 'TIMESTAMPTZ', allowNull: false },
        open: { type: DataType.INTEGER, allowNull: false },
        high: { type: DataType.INTEGER, allowNull: false },
        low: { type: DataType.INTEGER, allowNull: false },
        close: { type: DataType.INTEGER, allowNull: false },
        volume: { type: DataType.INTEGER, allowNull: false },
      });
      await sequelize.query(
        `SELECT create_hypertable('${tableName}', 'timestamp')`,
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
