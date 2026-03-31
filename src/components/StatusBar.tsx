interface StatusBarProps {
  symbol: string;
  timeframe: string;
  candleCount: number;
}

export function StatusBar({ symbol, timeframe, candleCount }: StatusBarProps) {
  return (
    <div className="flex items-center bg-[#080b14] border-t border-[#1e2538] px-3 h-6 text-[9px] font-mono text-gray-500 gap-4 shrink-0">
      <span>GoChart Pro v2.0</span>
      <span>•</span>
      <span>{symbol}</span>
      <span>•</span>
      <span>TF: {timeframe}</span>
      <span>•</span>
      <span>Bars: {candleCount}</span>
      <div className="flex-1" />
      <span>UTC {new Date().toISOString().slice(11, 19)}</span>
      <span>•</span>
      <span className="text-green-500">Connected</span>
    </div>
  );
}
