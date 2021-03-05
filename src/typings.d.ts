import * as ccxt from 'ccxt';

export type ExchangeRequestType = 'OHLCV';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BaseExchangeRequestPayload {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BaseExchangeResponseData {}

export interface ExchangeRequestJob<T extends BaseExchangeRequestPayload> {
  type: ExchangeRequestType;
  payload: T;
}

export interface ExchangeResponse {
  type: ExchangeRequestType;
  data: BaseExchangeResponseData;
}

export interface OHLCVRequestPayload extends BaseExchangeRequestPayload {
  symbol: string;
  timeframe: string;
  from?: number;
  limit?: number;
}

interface OHLCVResponseData extends BaseExchangeResponseData {
  items: ccxt.OHLCV[];
}
