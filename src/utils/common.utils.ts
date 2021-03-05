import { isNil } from 'lodash';

export const getEnv = (key: string, fallback: any = null) => {
  return isNil(process.env[key]) ? fallback : process.env[key];
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
