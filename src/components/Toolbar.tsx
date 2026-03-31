interface ToolbarProps {
  symbol: string;
  exchange: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  showOrderFlow: boolean;
  onToggleOrderFlow: () => void;
  showDelta: boolean;
  onToggleDelta: () => void;
  showVolume: boolean;
  onToggleVolume: () => void;
  showPOC: boolean;
  onTogglePOC: () => void;
  lastPrice: number;
  priceChange: number;
  currency: string;
  onOpenSymbolSearch: () => void;
  showLiquidity: boolean;
  onToggleLiquidity: () => void;
  onOpenLiquiditySettings: () => void;
}

export function Toolbar({
  symbol,
  exchange,
  timeframe,
  onTimeframeChange,
  showOrderFlow,
  onToggleOrderFlow,
  showDelta,
  onToggleDelta,
  showVolume,
  onToggleVolume,
  showPOC,
  onTogglePOC,
  lastPrice,
  priceChange,
  currency,
  onOpenSymbolSearch,
  showLiquidity,
  onToggleLiquidity,
  onOpenLiquiditySettings,
}: ToolbarProps) {
  const timeframes = ['1m', '3m', '5m', '15m', '30m', '1H', '4H', '1D'];

  return (
    <div className="flex items-center bg-[#0f1320] border-b border-[#1e2538] px-3 h-10 gap-2 text-xs select-none shrink-0">
      {/* Symbol - clickable to open search */}
      <button
        onClick={onOpenSymbolSearch}
        className="flex items-center gap-2 pr-3 border-r border-[#1e2538] hover:bg-[#1a2035] rounded-l px-2 py-1 -ml-2 transition-colors group"
        title="Search symbol (Ctrl+K)"
      >
        <div className="w-5 h-5 rounded bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-[7px] font-bold text-white shrink-0">
          {symbol.slice(0, 2)}
        </div>
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-semibold text-sm group-hover:text-blue-300 transition-colors">{symbol}</span>
            <span className="text-[8px] text-gray-500 bg-[#1a2035] px-1 py-0.5 rounded">{exchange}</span>
          </div>
        </div>
        <span className={`font-mono text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {currency}{lastPrice.toFixed(2)}
        </span>
        <span className={`font-mono text-[10px] ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)} ({((priceChange / lastPrice) * 100).toFixed(2)}%)
        </span>
        {/* Search icon */}
        <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* Timeframes */}
      <div className="flex items-center gap-0.5 pr-3 border-r border-[#1e2538]">
        {timeframes.map(tf => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              timeframe === tf
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#1a2035]'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart Type Toggles */}
      <div className="flex items-center gap-1 pr-3 border-r border-[#1e2538]">
        <button
          onClick={onToggleOrderFlow}
          className={`px-2 py-1 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
            showOrderFlow
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
              : 'text-gray-400 hover:text-white hover:bg-[#1a2035]'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="0.8"/>
            <rect x="7" y="3" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="0.8"/>
            <line x1="3" y1="3" x2="3" y2="9" stroke="currentColor" strokeWidth="0.5"/>
            <line x1="9" y1="5" x2="9" y2="7" stroke="currentColor" strokeWidth="0.5"/>
          </svg>
          Order Flow
        </button>

        <button
          onClick={onToggleDelta}
          className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
            showDelta
              ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
              : 'text-gray-400 hover:text-white hover:bg-[#1a2035]'
          }`}
        >
          Δ Delta
        </button>

        <button
          onClick={onToggleVolume}
          className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
            showVolume
              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
              : 'text-gray-400 hover:text-white hover:bg-[#1a2035]'
          }`}
        >
          Vol
        </button>

        <button
          onClick={onTogglePOC}
          className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
            showPOC
              ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/40'
              : 'text-gray-400 hover:text-white hover:bg-[#1a2035]'
          }`}
        >
          POC
        </button>

        {/* Liquidity Map Toggle + Settings */}
        <div className="flex items-center">
          <button
            onClick={onToggleLiquidity}
            className={`px-2 py-1 rounded-l text-[10px] font-medium transition-colors flex items-center gap-1 ${
              showLiquidity
                ? 'bg-orange-600/30 text-orange-300 border border-orange-500/40 border-r-0'
                : 'text-gray-400 hover:text-white hover:bg-[#1a2035]'
            }`}
            title="Toggle Liquidity Map"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="0.7" strokeDasharray="1.5 1"/>
              <rect x="2" y="3" width="3" height="2" rx="0.5" fill="currentColor" opacity="0.4"/>
              <rect x="6" y="5" width="4" height="2" rx="0.5" fill="currentColor" opacity="0.6"/>
              <rect x="3" y="7" width="5" height="2" rx="0.5" fill="currentColor" opacity="0.8"/>
            </svg>
            Liquidity
          </button>
          <button
            onClick={onOpenLiquiditySettings}
            className={`px-1 py-1 rounded-r text-[10px] transition-colors ${
              showLiquidity
                ? 'bg-orange-600/30 text-orange-300 border border-orange-500/40 border-l-0 hover:bg-orange-600/50'
                : 'text-gray-400 hover:text-white hover:bg-[#1a2035]'
            }`}
            title="Liquidity Map Settings"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side controls */}
      <div className="flex items-center gap-2 text-gray-400">
        <span className="text-[9px] text-gray-600 hidden xl:inline">Ctrl+K: Search</span>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] text-green-400">LIVE</span>
      </div>
    </div>
  );
}
