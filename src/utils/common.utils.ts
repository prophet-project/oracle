import { isNil } from 'lodash';

export const getEnv = (key: string, fallback: any = null) => {
  return isNil(process.env[key]) ? fallback : process.env[key];
};

export const sleep = <T>(ms: number, value?: T) =>
  new Promise<T>((resolve) => setTimeout(resolve, ms, value));
