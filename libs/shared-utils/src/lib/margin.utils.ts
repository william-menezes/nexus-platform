export interface PriceComponents {
  priceEffective: number;
  productCost: number;
  taxRate: number;      // ex: 0.15 = 15%
  cardFeeRate: number;  // ex: 0.03 = 3%
  otherCosts?: number;
}

export function calcProfit(c: PriceComponents): number {
  const taxes   = c.priceEffective * c.taxRate;
  const cardFee = c.priceEffective * c.cardFeeRate;
  return c.priceEffective - c.productCost - taxes - cardFee - (c.otherCosts ?? 0);
}

export function calcIdealPrice(cost: number, targetMarginPct: number): number {
  return cost / (1 - targetMarginPct / 100);
}

export function calcMarginDelta(ideal: number, effective: number): number {
  return ((effective - ideal) / ideal) * 100;
}
