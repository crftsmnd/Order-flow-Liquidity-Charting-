import type { CandleData } from '../data/marketData';

interface InfoPanelProps {
  data: CandleData[];
}

export function InfoPanel({ data }: InfoPanelProps) {
  if (data.length === 0) return null;

  const last = data[data.length - 1];
  const first = data[0];
  const sessionHigh = Math.max(...data.map(c => c.high));
  const sessionLow = Math.min(...data.map(c => c.low));
  const totalVolume = data.reduce((s, c) => s + c.volume, 0);
  const totalDelta = data.reduce((s, c) => s + c.delta, 0);
  const avgVolume = Math.floor(totalVolume / data.length);

  const stats = [
    { label: 'Session High', value: sessionHigh.toFixed(2), color: 'text-green-400' },
    { label: 'Session Low', value: sessionLow.toFixed(2), color: 'text-red-400' },
    { label: 'Open', value: first.open.toFixed(2), color: 'text-white' },
    { label: 'Last', value: last.close.toFixed(2), color: last.close >= last.open ? 'text-green-400' : 'text-red-400' },
    { label: 'Change', value: (last.close - first.open).toFixed(2), color: last.close >= first.open ? 'text-green-400' : 'text-red-400' },
    { label: 'Change %', value: (((last.close - first.open) / first.open) * 100).toFixed(2) + '%', color: last.close >= first.open ? 'text-green-400' : 'text-red-400' },
    { label: 'Total Volume', value: totalVolume.toLocaleString(), color: 'text-blue-400' },
    { label: 'Avg Volume', value: avgVolume.toLocaleString(), color: 'text-blue-300' },
    { label: 'Net Delta', value: (totalDelta >= 0 ? '+' : '') + totalDelta.toLocaleString(), color: totalDelta >= 0 ? 'text-green-400' : 'text-red-400' },
    { label: 'Cum. Delta', value: (last.cumulativeDelta >= 0 ? '+' : '') + last.cumulativeDelta.toLocaleString(), color: last.cumulativeDelta >= 0 ? 'text-green-400' : 'text-red-400' },
    { label: 'Candles', value: data.length.toString(), color: 'text-gray-300' },
    { label: 'Last POC', value: last.poc.toFixed(2), color: 'text-yellow-400' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0e17] text-[10px] font-mono p-2">
      <div className="text-gray-400 text-[11px] font-semibold mb-3 border-b border-[#1e2538] pb-1">
        Session Statistics
      </div>
      <div className="space-y-1.5">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between">
            <span className="text-gray-500">{stat.label}</span>
            <span className={stat.color}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-[#1e2538] pt-3">
        <div className="text-gray-400 text-[11px] font-semibold mb-2">Order Flow Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500/40 rounded-sm" />
            <span className="text-gray-400">Ask Volume (Buyers)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500/40 rounded-sm" />
            <span className="text-gray-400">Bid Volume (Sellers)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500/40 rounded-sm border border-yellow-500/60 border-dashed" />
            <span className="text-gray-400">POC (Point of Control)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-[9px]">+Δ</span>
            <span className="text-gray-400">Positive Delta (Buying pressure)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-[9px]">-Δ</span>
            <span className="text-gray-400">Negative Delta (Selling pressure)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
