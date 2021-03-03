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

export interface ExchangeJobPayload {
  symbol: string;
  timeFrame: TimeFrame;
  from?: number;
  limit?: number;
}

interface ExchangeJobResult {
  data: ccxt.OHLCV[];
}
