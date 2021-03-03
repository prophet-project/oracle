import * as ccxt from 'ccxt';

export type TimeFrame =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '8h'
  | '12h'
  | '1d'
  | '3d'
  | '1w'
  | '1M';

export type ExchangeRequestType = 'OHLCV';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BaseExchangeRequestPayload {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BaseExchangeResponseData {}

export interface ExchangeRequestJob {
  type: ExchangeRequestType;
  payload: BaseExchangeRequestPayload;
}

export interface ExchangeResponse {
  type: ExchangeRequestType;
  data: BaseExchangeResponseData;
}

export interface OHLCVRequestPayload extends BaseExchangeRequestPayload {
  symbol: string;
  timeFrame: TimeFrame;
  from?: number;
  limit?: number;
}

interface OHLCVResponseData extends BaseExchangeResponseData {
  items: ccxt.OHLCV[];
}
