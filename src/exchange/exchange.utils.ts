export const getTableName = (symbol: string, timeframe: string) => {
  return `${symbol.toLowerCase().replace('/', '_')}_${timeframe}`;
};
