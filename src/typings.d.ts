import * as ccxt from 'ccxt';

export type ExchangeRequestType = 'OHLCV';
export type DataSyncType = 'NEWER' | 'OLDER';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BaseExchangeRequestPayload {}

export interface ExchangeRequestJob<T extends BaseExchangeRequestPayload> {
  type: ExchangeRequestType;
  payload: T;
}

export interface OHLCVRequestPayload extends BaseExchangeRequestPayload {
  symbol: string;
  timeframe: string;
  from?: number;
  limit?: number;
  timeout?: number;
}

export interface ExchangeResponse<T> {
  type: ExchangeRequestType;
  data: T;
}

type OHLCVResponseData = ccxt.OHLCV[] | null;
