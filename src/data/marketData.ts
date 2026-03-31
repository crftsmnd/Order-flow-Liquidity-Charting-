export interface OrderFlowLevel {
  price: number;
  bidVolume: number;
  askVolume: number;
  delta: number;
}

export interface CandleData {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  orderFlow: OrderFlowLevel[];
  delta: number;
  cumulativeDelta: number;
  poc: number;
}

function generateOrderFlow(open: number, high: number, low: number, close: number, volume: number): OrderFlowLevel[] {
  const levels: OrderFlowLevel[] = [];
  const range = high - low;
  const numLevels = Math.max(4, Math.min(20, Math.floor(range / Math.max(0.01, range * 0.08)) + 1));
  const adjustedStep = range / (numLevels - 1 || 1);

  let totalVol = 0;
  const isBullish = close >= open;

  for (let i = 0; i < numLevels; i++) {
    const price = parseFloat((low + i * adjustedStep).toFixed(2));

    const distFromMid = Math.abs(price - (open + close) / 2) / (range || 1);
    const baseVol = Math.max(5, Math.floor((volume / numLevels) * (1.5 - distFromMid) * (0.7 + Math.random() * 0.6)));

    const pricePosition = (price - low) / (range || 1);
    let askRatio: number;

    if (isBullish) {
      askRatio = 0.4 + pricePosition * 0.3 + Math.random() * 0.15;
    } else {
      askRatio = 0.6 - pricePosition * 0.3 + Math.random() * 0.15;
    }
    askRatio = Math.max(0.15, Math.min(0.85, askRatio));

    const askVolume = Math.floor(baseVol * askRatio);
    const bidVolume = baseVol - askVolume;

    levels.push({
      price,
      bidVolume,
      askVolume,
      delta: askVolume - bidVolume,
    });
    totalVol += baseVol;
  }

  const scaleFactor = volume / (totalVol || 1);
  levels.forEach(l => {
    l.bidVolume = Math.max(1, Math.round(l.bidVolume * scaleFactor));
    l.askVolume = Math.max(1, Math.round(l.askVolume * scaleFactor));
    l.delta = l.askVolume - l.bidVolume;
  });

  return levels;
}

export function generateMarketData(numCandles: number = 120, basePrice?: number): CandleData[] {
  const candles: CandleData[] = [];
  let price = (basePrice ?? 19450) + (Math.random() - 0.5) * (basePrice ?? 19450) * 0.02;
  let cumulativeDelta = 0;
  const baseTime = Date.now() - numCandles * 5 * 60 * 1000;

  // Scale volatility to the price level
  const priceLevel = basePrice ?? 19450;
  const volScale = priceLevel * 0.001; // ~0.1% of price

  for (let i = 0; i < numCandles; i++) {
    const timestamp = baseTime + i * 5 * 60 * 1000;
    const date = new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const volatility = volScale * (0.5 + Math.random() * 1.5);
    const trend = Math.sin(i / 20) * volScale * 0.3 + (Math.random() - 0.48) * volScale * 0.5;

    const open = price;
    const change = trend + (Math.random() - 0.5) * volatility;
    const close = parseFloat((open + change).toFixed(2));
    const highExtra = Math.random() * volatility * 0.5;
    const lowExtra = Math.random() * volatility * 0.5;
    const high = parseFloat((Math.max(open, close) + highExtra).toFixed(2));
    const low = parseFloat((Math.min(open, close) - lowExtra).toFixed(2));

    const volume = Math.floor(500 + Math.random() * 3000 + Math.abs(change) * 100);

    const orderFlow = generateOrderFlow(open, high, low, close, volume);
    const delta = orderFlow.reduce((sum, l) => sum + l.delta, 0);
    cumulativeDelta += delta;

    const poc = orderFlow.reduce((max, l) =>
      (l.bidVolume + l.askVolume) > (max.bidVolume + max.askVolume) ? l : max
    ).price;

    candles.push({
      timestamp,
      date,
      open,
      high,
      low,
      close,
      volume,
      orderFlow,
      delta,
      cumulativeDelta,
      poc,
    });

    price = close;
  }

  return candles;
}

export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

export function generateOrderBook(currentPrice: number): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  let bidTotal = 0;
  let askTotal = 0;

  const step = Math.max(0.01, currentPrice * 0.0003);

  for (let i = 0; i < 15; i++) {
    const bidSize = Math.floor(20 + Math.random() * 200);
    bidTotal += bidSize;
    bids.push({
      price: parseFloat((currentPrice - (i + 1) * step).toFixed(2)),
      size: bidSize,
      total: bidTotal,
    });

    const askSize = Math.floor(20 + Math.random() * 200);
    askTotal += askSize;
    asks.push({
      price: parseFloat((currentPrice + (i + 1) * step).toFixed(2)),
      size: askSize,
      total: askTotal,
    });
  }

  return { bids, asks };
}
