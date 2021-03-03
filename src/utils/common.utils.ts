import { isNil } from 'lodash';

export const getEnv = (key: string, fallback: any = null) => {
  return isNil(process.env[key]) ? fallback : process.env[key];
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMillisecondsByUnit = (unit: string) => {
  switch (unit) {
    case 's':
      return 1000;
    case 'm':
      return 60 * 1000;
    case 'h':
      return 60 * 60 * 1000;
    case 'd':
      return 24 * 60 * 60 * 1000;
    case 'w':
      return 7 * 24 * 60 * 60 * 1000;
    case 'M':
      return 4 * 7 * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown unit: "${unit}"`);
  }
};

export const stringDurationToMilliseconds = (value: string) => {
  const unit = value.slice(-1);
  return +value.slice(0, -1) * getMillisecondsByUnit(unit);
};
