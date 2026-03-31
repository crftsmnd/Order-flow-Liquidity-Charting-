import { useState, useMemo, useEffect, useCallback } from 'react';
import { generateMarketData, generateOrderBook } from './data/marketData';
import { generateLiquidityMap, DEFAULT_LIQUIDITY_SETTINGS, type LiquiditySettings as LiqSettings } from './data/liquidityData';
import { getSymbolInfo, type SymbolInfo } from './data/symbols';
import { OrderFlowChart } from './components/OrderFlowChart';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { OrderBook } from './components/OrderBook';
import { TradesTape } from './components/TradesTape';
import { InfoPanel } from './components/InfoPanel';
import { StatusBar } from './components/StatusBar';
import { SymbolSearch } from './components/SymbolSearch';
import { LiquiditySettings } from './components/LiquiditySettings';

export function App() {
  const [timeframe, setTimeframe] = useState('5m');
  const [showOrderFlow, setShowOrderFlow] = useState(true);
  const [showDelta, setShowDelta] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showPOC, setShowPOC] = useState(true);
  const [rightPanel, setRightPanel] = useState('orderbook');
  const [symbolSearchOpen, setSymbolSearchOpen] = useState(false);

  // Liquidity map state
  const [liquiditySettings, setLiquiditySettings] = useState<LiqSettings>(DEFAULT_LIQUIDITY_SETTINGS);
  const [liquiditySettingsOpen, setLiquiditySettingsOpen] = useState(false);

  // Current symbol info
  const [currentSymbol, setCurrentSymbol] = useState<SymbolInfo>(() => {
    return getSymbolInfo('NIFTY 50 FUT')!;
  });

  const [data, setData] = useState(() => generateMarketData(120, currentSymbol.basePrice));

  const lastPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const prevClose = data.length > 1 ? data[data.length - 2].close : lastPrice;
  const priceChange = lastPrice - prevClose;

  const orderBook = useMemo(() => generateOrderBook(lastPrice), [lastPrice]);

  // Generate liquidity data (memoized - regenerates when data set changes)
  const liquidityData = useMemo(() => {
    if (!liquiditySettings.enabled) return [];
    return generateLiquidityMap(data, liquiditySettings.resolution);
  }, [data, liquiditySettings.enabled, liquiditySettings.resolution]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev];
        const last = { ...newData[newData.length - 1] };
        const volatility = currentSymbol.basePrice * 0.0001;
        const change = (Math.random() - 0.5) * volatility * 2;
        last.close = parseFloat((last.close + change).toFixed(2));
        last.high = Math.max(last.high, last.close);
        last.low = Math.min(last.low, last.close);
        last.volume += Math.floor(Math.random() * 20);

        const lastLevel = last.orderFlow[last.orderFlow.length - 1];
        if (lastLevel) {
          if (change > 0) {
            lastLevel.askVolume += Math.floor(Math.random() * 5);
          } else {
            lastLevel.bidVolume += Math.floor(Math.random() * 5);
          }
          lastLevel.delta = lastLevel.askVolume - lastLevel.bidVolume;
        }

        last.delta = last.orderFlow.reduce((sum, l) => sum + l.delta, 0);
        newData[newData.length - 1] = last;
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSymbol.basePrice]);

  const handleTimeframeChange = useCallback((tf: string) => {
    setTimeframe(tf);
    setData(generateMarketData(120, currentSymbol.basePrice));
  }, [currentSymbol.basePrice]);

  const handleSymbolSelect = useCallback((sym: SymbolInfo) => {
    setCurrentSymbol(sym);
    setData(generateMarketData(120, sym.basePrice));
  }, []);

  // Keyboard shortcut: Ctrl+K to open symbol search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSymbolSearchOpen(v => !v);
      }
      if (e.key === 'Escape') {
        setSymbolSearchOpen(false);
        setLiquiditySettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0e17] overflow-hidden">
      {/* Symbol Search Modal */}
      <SymbolSearch
        isOpen={symbolSearchOpen}
        onClose={() => setSymbolSearchOpen(false)}
        onSelect={handleSymbolSelect}
        currentSymbol={currentSymbol.symbol}
      />

      {/* Liquidity Settings Modal */}
      {liquiditySettingsOpen && (
        <LiquiditySettings
          settings={liquiditySettings}
          onUpdate={setLiquiditySettings}
          onClose={() => setLiquiditySettingsOpen(false)}
        />
      )}

      {/* Top Toolbar */}
      <Toolbar
        symbol={currentSymbol.symbol}
        exchange={currentSymbol.exchange}
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        showOrderFlow={showOrderFlow}
        onToggleOrderFlow={() => setShowOrderFlow(v => !v)}
        showDelta={showDelta}
        onToggleDelta={() => setShowDelta(v => !v)}
        showVolume={showVolume}
        onToggleVolume={() => setShowVolume(v => !v)}
        showPOC={showPOC}
        onTogglePOC={() => setShowPOC(v => !v)}
        lastPrice={lastPrice}
        priceChange={priceChange}
        currency={currentSymbol.currency}
        onOpenSymbolSearch={() => setSymbolSearchOpen(true)}
        showLiquidity={liquiditySettings.enabled}
        onToggleLiquidity={() => setLiquiditySettings(s => ({ ...s, enabled: !s.enabled }))}
        onOpenLiquiditySettings={() => setLiquiditySettingsOpen(true)}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Drawing Tools */}
        <Sidebar activeTab={rightPanel} onTabChange={setRightPanel} />

        {/* Chart Area */}
        <div className="flex flex-1 overflow-hidden">
          <OrderFlowChart
            data={data}
            showOrderFlow={showOrderFlow}
            showDelta={showDelta}
            showVolume={showVolume}
            showPOC={showPOC}
            liquidityData={liquidityData}
            liquiditySettings={liquiditySettings}
          />

          {/* Right Panel */}
          {rightPanel && (
            <div className="w-52 border-l border-[#1e2538] flex flex-col shrink-0">
              {/* Panel header */}
              <div className="flex items-center justify-between px-2 py-1.5 bg-[#0d1120] border-b border-[#1e2538]">
                <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
                  {rightPanel === 'orderbook' ? 'Order Book' : rightPanel === 'trades' ? 'Time & Sales' : 'Info'}
                </span>
                <button
                  onClick={() => setRightPanel('')}
                  className="text-gray-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-hidden">
                {rightPanel === 'orderbook' && (
                  <OrderBook bids={orderBook.bids} asks={orderBook.asks} lastPrice={lastPrice} />
                )}
                {rightPanel === 'trades' && <TradesTape lastPrice={lastPrice} />}
                {rightPanel === 'info' && <InfoPanel data={data} />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar symbol={currentSymbol.symbol} timeframe={timeframe} candleCount={data.length} />
    </div>
  );
}
