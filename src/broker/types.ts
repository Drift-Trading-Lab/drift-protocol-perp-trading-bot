export type Side = "buy" | "sell";
export type OrderRequest = { symbol: string; side: Side; amountUsd: number; reduceOnly?: boolean; tag?: string; leverage?: number };
export type Fill = { symbol: string; side: Side; price: number; amount: number; feeUsd: number; ts: number; tag?: string };
export type Broker = {
  name: string;
  getMid(symbol: string): Promise<number>;
  getFunding?(symbol: string): Promise<number>;
  place(order: OrderRequest): Promise<Fill>;
  equityUsd(): number;
  positionQty(symbol: string): number;
};
