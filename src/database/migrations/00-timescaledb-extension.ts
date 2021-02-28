import { Sequelize } from 'sequelize-typescript';

export default {
  name: '00-timescaledb-extension',
  up(sequelize: Sequelize) {
    return sequelize.query('CREATE EXTENSION IF NOT EXISTS timescaledb');
  },
  down(sequelize: Sequelize) {
    return sequelize.query('DROP EXTENSION timescaledb');
  },
};
