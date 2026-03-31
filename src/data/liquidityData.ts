/**
 * Liquidity Map Data Generation
 * Simulates pending limit orders (buy/sell) at price levels across time.
 * Each cell in the heatmap has a number of pending orders at that price/time.
 */

export interface LiquidityLevel {
  price: number;
  orders: number;        // total pending orders at this price
  buyOrders: number;     // pending buy limit orders
  sellOrders: number;    // pending sell limit orders
  totalSize: number;     // total size (contracts/shares)
}

export interface LiquidityCandle {
  timestamp: number;
  levels: LiquidityLevel[];
}

export interface LiquiditySettings {
  enabled: boolean;
  opacity: number;            // 0.0 - 1.0
  lowThreshold: number;       // minimum orders to show
  medThreshold: number;       // medium liquidity threshold
  highThreshold: number;      // high liquidity threshold
  ultraThreshold: number;     // ultra high (whale) threshold
  showBuyLiquidity: boolean;
  showSellLiquidity: boolean;
  colorScheme: 'heatmap' | 'bidask' | 'intensity' | 'depth';
  resolution: number;         // price levels per candle range
  showLabels: boolean;
}

export const DEFAULT_LIQUIDITY_SETTINGS: LiquiditySettings = {
  enabled: true,
  opacity: 0.55,
  lowThreshold: 5,
  medThreshold: 20,
  highThreshold: 50,
  ultraThreshold: 100,
  showBuyLiquidity: true,
  showSellLiquidity: true,
  colorScheme: 'heatmap',
  resolution: 30,
  showLabels: false,
};

/**
 * Generates liquidity map data based on candle data.
 * Creates realistic-looking pending order clusters around:
 * - Support/resistance levels
 * - Round numbers
 * - Previous highs/lows
 * - Current price area
 */
export function generateLiquidityMap(
  candles: { timestamp: number; open: number; high: number; low: number; close: number; volume: number }[],
  resolution: number = 30
): LiquidityCandle[] {
  if (candles.length === 0) return [];

  // Find overall price range
  let globalMin = Infinity, globalMax = -Infinity;
  candles.forEach(c => {
    if (c.low < globalMin) globalMin = c.low;
    if (c.high > globalMax) globalMax = c.high;
  });

  const globalRange = globalMax - globalMin;
  const padding = globalRange * 0.15;
  globalMin -= padding;
  globalMax += padding;
  const priceStep = (globalMax - globalMin) / resolution;

  // Identify key levels (support/resistance)
  const keyLevels: number[] = [];

  // Round number levels
  const roundStep = calculateRoundStep(globalRange);
  for (let p = Math.floor(globalMin / roundStep) * roundStep; p <= globalMax; p += roundStep) {
    keyLevels.push(p);
  }

  // Previous highs and lows
  candles.forEach((c, i) => {
    if (i % 5 === 0) {
      keyLevels.push(c.high);
      keyLevels.push(c.low);
    }
  });

  const liquidityCandles: LiquidityCandle[] = [];

  candles.forEach((candle, ci) => {
    const levels: LiquidityLevel[] = [];

    for (let li = 0; li < resolution; li++) {
      const price = globalMin + li * priceStep;

      // Base liquidity - some random noise
      let buyOrders = Math.floor(Math.random() * 3);
      let sellOrders = Math.floor(Math.random() * 3);

      // More orders near current price
      const distFromPrice = Math.abs(price - candle.close);
      const priceProximity = 1 - Math.min(1, distFromPrice / (globalRange * 0.3));
      buyOrders += Math.floor(priceProximity * priceProximity * Math.random() * 15);
      sellOrders += Math.floor(priceProximity * priceProximity * Math.random() * 15);

      // Buy orders tend to cluster below price, sell orders above
      if (price < candle.close) {
        buyOrders = Math.floor(buyOrders * (1.5 + Math.random()));
        sellOrders = Math.floor(sellOrders * 0.4);
      } else {
        sellOrders = Math.floor(sellOrders * (1.5 + Math.random()));
        buyOrders = Math.floor(buyOrders * 0.4);
      }

      // Key level clustering (support/resistance)
      for (const kl of keyLevels) {
        const distFromKey = Math.abs(price - kl);
        if (distFromKey < priceStep * 2) {
          const keyStrength = 1 - distFromKey / (priceStep * 2);
          const cluster = Math.floor(keyStrength * keyStrength * (10 + Math.random() * 40));
          if (kl < candle.close) {
            buyOrders += cluster;
          } else {
            sellOrders += cluster;
          }
        }
      }

      // Whale clusters (rare large order pools)
      const whaleChance = 0.008;
      if (Math.random() < whaleChance) {
        const whaleOrders = 50 + Math.floor(Math.random() * 150);
        if (price < candle.close) {
          buyOrders += whaleOrders;
        } else {
          sellOrders += whaleOrders;
        }
      }

      // Time-decay: orders further from current candle may be thinner
      const timeFactor = 0.6 + 0.4 * (ci / candles.length);
      buyOrders = Math.floor(buyOrders * timeFactor);
      sellOrders = Math.floor(sellOrders * timeFactor);

      // Volume scaling
      const volRatio = candle.volume / 1500;
      buyOrders = Math.floor(buyOrders * Math.max(0.3, Math.min(2.5, volRatio)));
      sellOrders = Math.floor(sellOrders * Math.max(0.3, Math.min(2.5, volRatio)));

      const totalOrders = buyOrders + sellOrders;
      const totalSize = totalOrders * (1 + Math.floor(Math.random() * 10));

      levels.push({
        price,
        orders: totalOrders,
        buyOrders,
        sellOrders,
        totalSize,
      });
    }

    liquidityCandles.push({
      timestamp: candle.timestamp,
      levels,
    });
  });

  return liquidityCandles;
}

function calculateRoundStep(range: number): number {
  const steps = [0.5, 1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  const ideal = range / 8;
  for (const s of steps) {
    if (s >= ideal * 0.5) return s;
  }
  return steps[steps.length - 1];
}

/**
 * Returns RGBA color for a liquidity level based on settings and scheme
 */
export function getLiquidityColor(
  orders: number,
  buyOrders: number,
  sellOrders: number,
  settings: LiquiditySettings,
): { r: number; g: number; b: number; a: number } | null {
  if (orders < settings.lowThreshold) return null;

  const { colorScheme, opacity } = settings;

  // Filter by buy/sell visibility
  let visibleOrders = 0;
  if (settings.showBuyLiquidity) visibleOrders += buyOrders;
  if (settings.showSellLiquidity) visibleOrders += sellOrders;
  if (visibleOrders < settings.lowThreshold) return null;

  // Intensity based on thresholds
  let intensity: number;
  if (visibleOrders >= settings.ultraThreshold) {
    intensity = 1.0;
  } else if (visibleOrders >= settings.highThreshold) {
    intensity = 0.7 + 0.3 * ((visibleOrders - settings.highThreshold) / (settings.ultraThreshold - settings.highThreshold));
  } else if (visibleOrders >= settings.medThreshold) {
    intensity = 0.4 + 0.3 * ((visibleOrders - settings.medThreshold) / (settings.highThreshold - settings.medThreshold));
  } else {
    intensity = 0.1 + 0.3 * ((visibleOrders - settings.lowThreshold) / (settings.medThreshold - settings.lowThreshold));
  }

  intensity = Math.max(0, Math.min(1, intensity));
  const alpha = intensity * opacity;

  switch (colorScheme) {
    case 'heatmap': {
      // Cold (blue) -> Warm (yellow) -> Hot (red) -> White-hot
      if (intensity < 0.25) {
        return { r: 20, g: 60, b: 180, a: alpha };
      } else if (intensity < 0.5) {
        const t = (intensity - 0.25) / 0.25;
        return { r: Math.floor(20 + 200 * t), g: Math.floor(60 + 140 * t), b: Math.floor(180 - 120 * t), a: alpha };
      } else if (intensity < 0.75) {
        const t = (intensity - 0.5) / 0.25;
        return { r: Math.floor(220 + 35 * t), g: Math.floor(200 - 100 * t), b: Math.floor(60 - 60 * t), a: alpha };
      } else {
        const t = (intensity - 0.75) / 0.25;
        return { r: 255, g: Math.floor(100 - 60 * t), b: Math.floor(0 + 80 * t), a: alpha };
      }
    }
    case 'bidask': {
      // Buy = green, Sell = red, mixed = yellow
      const buyRatio = buyOrders / Math.max(1, buyOrders + sellOrders);
      if (buyRatio > 0.65) {
        return { r: 0, g: Math.floor(120 + 135 * intensity), b: Math.floor(40 + 40 * intensity), a: alpha };
      } else if (buyRatio < 0.35) {
        return { r: Math.floor(150 + 105 * intensity), g: Math.floor(20 + 30 * intensity), b: Math.floor(20 + 30 * intensity), a: alpha };
      } else {
        return { r: Math.floor(200 + 55 * intensity), g: Math.floor(170 + 55 * intensity), b: 0, a: alpha };
      }
    }
    case 'intensity': {
      // Single color (cyan) with varying intensity
      return {
        r: Math.floor(0 + 60 * intensity),
        g: Math.floor(150 * intensity),
        b: Math.floor(200 + 55 * intensity),
        a: alpha,
      };
    }
    case 'depth': {
      // Purple -> magenta -> pink for depth
      return {
        r: Math.floor(80 + 175 * intensity),
        g: Math.floor(20 + 40 * intensity),
        b: Math.floor(160 + 95 * intensity),
        a: alpha,
      };
    }
    default:
      return { r: 200, g: 200, b: 200, a: alpha };
  }
}
