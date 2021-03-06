import * as _ from 'lodash';
import { Sequelize } from 'sequelize-typescript';
import OHLCVCandle from 'src/exchange/models/ohlcv-candle';

const PREFIX = 'ohlcv';
export const TIMEFRAMES = ['1m', '1h', '1d'];

export default {
  name: '01-create-ohlcv-tables',
  async up(sequelize: Sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    for (const timeFrame of TIMEFRAMES) {
      const tableName = `${PREFIX}_${timeFrame}`;
      await queryInterface.createTable(tableName, OHLCVCandle);
      await sequelize.query(
        `SELECT create_hypertable('${tableName}', 'timestamp', chunk_time_interval => 86400000)`,
      );
    }
  },
  down(sequelize: Sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    return Promise.all(
      _.chain(TIMEFRAMES)
        .map((timeFrame) => queryInterface.dropTable(`${PREFIX}_${timeFrame}`))
        .value(),
    );
  },
};
