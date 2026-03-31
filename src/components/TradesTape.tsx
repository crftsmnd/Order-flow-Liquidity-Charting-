import { useMemo } from 'react';

interface Trade {
  time: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
}

interface TradesTapeProps {
  lastPrice: number;
}

export function TradesTape({ lastPrice }: TradesTapeProps) {
  const trades = useMemo(() => {
    const t: Trade[] = [];
    let p = lastPrice;
    for (let i = 0; i < 50; i++) {
      const side = Math.random() > 0.48 ? 'buy' : 'sell';
      p += (Math.random() - 0.5) * 0.5;
      const size = Math.floor(1 + Math.random() * 50);
      const now = new Date(Date.now() - i * 1000 * (1 + Math.random() * 3));
      t.push({
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: parseFloat(p.toFixed(2)),
        size,
        side,
      });
    }
    return t;
  }, [lastPrice]);

  return (
    <div className="flex flex-col h-full bg-[#0a0e17] text-[10px] font-mono">
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#1e2538] text-gray-500">
        <span>Time</span>
        <span>Price</span>
        <span>Size</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {trades.map((trade, i) => (
          <div
            key={i}
            className={`flex items-center justify-between px-2 py-0.5 ${
              trade.side === 'buy' ? 'bg-green-500/5' : 'bg-red-500/5'
            } hover:bg-white/5`}
          >
            <span className="text-gray-500">{trade.time}</span>
            <span className={trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
              {trade.price.toFixed(2)}
            </span>
            <span className="text-gray-300">{trade.size}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
