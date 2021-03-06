import { DataType } from 'sequelize-typescript';
import * as ccxt from 'ccxt';
import * as _ from 'lodash';
import { Model } from 'sequelize/types';

const OHLCVCandle = {
  timestamp: { type: DataType.BIGINT, allowNull: false, unique: true },
  open: { type: DataType.DOUBLE, allowNull: false },
  high: { type: DataType.DOUBLE, allowNull: false },
  low: { type: DataType.DOUBLE, allowNull: false },
  close: { type: DataType.DOUBLE, allowNull: false },
  volume: { type: DataType.DOUBLE, allowNull: false },
};

export const createOHLCVCandle = (data: ccxt.OHLCV) => {
  return _.chain(OHLCVCandle).keys().zipObject(data).value();
};

export const parseOHLCVCandle = (data: Model): ccxt.OHLCV => {
  return _.chain(data as _.Dictionary<any>)
    .values()
    .map((value) => (typeof value === 'string' ? +value : value))
    .value() as ccxt.OHLCV;
};

export default OHLCVCandle;
