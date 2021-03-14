import * as _ from 'lodash';
import { Sequelize } from 'sequelize-typescript';
import OHLCVCandle from 'src/exchange/models/ohlcv-candle';

const PREFIX = 'ohlcv';
export const TIMEFRAME = '15m';

export default {
  name: '03-create-ohlcv-15m-table',
  async up(sequelize: Sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    const tableName = `${PREFIX}_${TIMEFRAME}`;
    await queryInterface.createTable(tableName, OHLCVCandle);
    await sequelize.query(
      `SELECT create_hypertable('${tableName}', 'timestamp', chunk_time_interval => 86400000)`,
    );
  },
  down(sequelize: Sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    return queryInterface.dropTable(`${PREFIX}_${TIMEFRAME}`);
  },
};
