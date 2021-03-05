import { DataType } from 'sequelize-typescript';

const OHLCVCandle = {
  timestamp: { type: DataType.INTEGER, allowNull: false, unique: true },
  open: { type: DataType.DOUBLE, allowNull: false },
  high: { type: DataType.DOUBLE, allowNull: false },
  low: { type: DataType.DOUBLE, allowNull: false },
  close: { type: DataType.DOUBLE, allowNull: false },
  volume: { type: DataType.DOUBLE, allowNull: false },
};

export default OHLCVCandle;
