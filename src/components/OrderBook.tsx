import { useMemo } from 'react';
import type { OrderBookEntry } from '../data/marketData';

interface OrderBookProps {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastPrice: number;
}

export function OrderBook({ bids, asks, lastPrice }: OrderBookProps) {
  const maxTotal = useMemo(() => {
    const maxBid = bids.length > 0 ? bids[bids.length - 1].total : 0;
    const maxAsk = asks.length > 0 ? asks[asks.length - 1].total : 0;
    return Math.max(maxBid, maxAsk, 1);
  }, [bids, asks]);

  return (
    <div className="flex flex-col h-full bg-[#0a0e17] text-[10px] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#1e2538] text-gray-500">
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      {/* Asks (reversed so lowest ask is at bottom) */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end">
        {[...asks].reverse().map((ask, i) => (
          <div key={`ask-${i}`} className="relative flex items-center justify-between px-2 py-0.5 hover:bg-[#1a1020]">
            <div
              className="absolute right-0 top-0 bottom-0 bg-red-500/10"
              style={{ width: `${(ask.total / maxTotal) * 100}%` }}
            />
            <span className="relative text-red-400">{ask.price.toFixed(2)}</span>
            <span className="relative text-gray-300">{ask.size}</span>
            <span className="relative text-gray-500">{ask.total}</span>
          </div>
        ))}
      </div>

      {/* Spread / Last Price */}
      <div className="flex items-center justify-center py-1.5 border-y border-[#1e2538] bg-[#0d1120]">
        <span className="text-sm font-bold text-white">{lastPrice.toFixed(2)}</span>
        {asks.length > 0 && bids.length > 0 && (
          <span className="ml-2 text-gray-500 text-[9px]">
            Spread: {(asks[0].price - bids[0].price).toFixed(2)}
          </span>
        )}
      </div>

      {/* Bids */}
      <div className="flex-1 overflow-hidden">
        {bids.map((bid, i) => (
          <div key={`bid-${i}`} className="relative flex items-center justify-between px-2 py-0.5 hover:bg-[#0a2010]">
            <div
              className="absolute right-0 top-0 bottom-0 bg-green-500/10"
              style={{ width: `${(bid.total / maxTotal) * 100}%` }}
            />
            <span className="relative text-green-400">{bid.price.toFixed(2)}</span>
            <span className="relative text-gray-300">{bid.size}</span>
            <span className="relative text-gray-500">{bid.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
