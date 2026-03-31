export interface SymbolInfo {
  symbol: string;
  name: string;
  exchange: string;
  type: 'futures' | 'stock' | 'index' | 'crypto' | 'forex' | 'commodity';
  basePrice: number;
  tickSize: number;
  lotSize: number;
  currency: string;
}

export const SYMBOLS: SymbolInfo[] = [
  // Indian Indices & Futures
  { symbol: 'NIFTY 50 FUT', name: 'Nifty 50 Futures', exchange: 'NSE', type: 'futures', basePrice: 19450, tickSize: 0.05, lotSize: 50, currency: '₹' },
  { symbol: 'BANKNIFTY FUT', name: 'Bank Nifty Futures', exchange: 'NSE', type: 'futures', basePrice: 44800, tickSize: 0.05, lotSize: 25, currency: '₹' },
  { symbol: 'FINNIFTY FUT', name: 'Fin Nifty Futures', exchange: 'NSE', type: 'futures', basePrice: 20200, tickSize: 0.05, lotSize: 40, currency: '₹' },
  { symbol: 'SENSEX FUT', name: 'Sensex Futures', exchange: 'BSE', type: 'futures', basePrice: 64500, tickSize: 0.05, lotSize: 10, currency: '₹' },

  // Indian Stocks
  { symbol: 'RELIANCE', name: 'Reliance Industries', exchange: 'NSE', type: 'stock', basePrice: 2450, tickSize: 0.05, lotSize: 1, currency: '₹' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', type: 'stock', basePrice: 3520, tickSize: 0.05, lotSize: 1, currency: '₹' },
  { symbol: 'INFY', name: 'Infosys Limited', exchange: 'NSE', type: 'stock', basePrice: 1450, tickSize: 0.05, lotSize: 1, currency: '₹' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', exchange: 'NSE', type: 'stock', basePrice: 1620, tickSize: 0.05, lotSize: 1, currency: '₹' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', exchange: 'NSE', type: 'stock', basePrice: 945, tickSize: 0.05, lotSize: 1, currency: '₹' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', exchange: 'NSE', type: 'stock', basePrice: 625, tickSize: 0.05, lotSize: 1, currency: '₹' },
  { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', type: 'stock', basePrice: 580, tickSize: 0.05, lotSize: 1, currency: '₹' },
  { symbol: 'WIPRO', name: 'Wipro Limited', exchange: 'NSE', type: 'stock', basePrice: 435, tickSize: 0.05, lotSize: 1, currency: '₹' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', exchange: 'NSE', type: 'stock', basePrice: 880, tickSize: 0.05, lotSize: 1, currency: '₹' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', exchange: 'NSE', type: 'stock', basePrice: 1740, tickSize: 0.05, lotSize: 1, currency: '₹' },

  // US Stocks
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'stock', basePrice: 185, tickSize: 0.01, lotSize: 1, currency: '$' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'stock', basePrice: 378, tickSize: 0.01, lotSize: 1, currency: '$' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'stock', basePrice: 140, tickSize: 0.01, lotSize: 1, currency: '$' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', type: 'stock', basePrice: 155, tickSize: 0.01, lotSize: 1, currency: '$' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', type: 'stock', basePrice: 240, tickSize: 0.01, lotSize: 1, currency: '$' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'stock', basePrice: 480, tickSize: 0.01, lotSize: 1, currency: '$' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', type: 'stock', basePrice: 330, tickSize: 0.01, lotSize: 1, currency: '$' },
  { symbol: 'SPY', name: 'S&P 500 ETF', exchange: 'NYSE', type: 'index', basePrice: 455, tickSize: 0.01, lotSize: 1, currency: '$' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', exchange: 'NASDAQ', type: 'index', basePrice: 385, tickSize: 0.01, lotSize: 1, currency: '$' },

  // US Futures
  { symbol: 'ES', name: 'E-mini S&P 500', exchange: 'CME', type: 'futures', basePrice: 4550, tickSize: 0.25, lotSize: 50, currency: '$' },
  { symbol: 'NQ', name: 'E-mini Nasdaq 100', exchange: 'CME', type: 'futures', basePrice: 15800, tickSize: 0.25, lotSize: 20, currency: '$' },
  { symbol: 'YM', name: 'E-mini Dow Jones', exchange: 'CBOT', type: 'futures', basePrice: 35200, tickSize: 1, lotSize: 5, currency: '$' },
  { symbol: 'CL', name: 'Crude Oil Futures', exchange: 'NYMEX', type: 'commodity', basePrice: 78.5, tickSize: 0.01, lotSize: 1000, currency: '$' },
  { symbol: 'GC', name: 'Gold Futures', exchange: 'COMEX', type: 'commodity', basePrice: 1985, tickSize: 0.10, lotSize: 100, currency: '$' },

  // Crypto
  { symbol: 'BTCUSDT', name: 'Bitcoin / USDT', exchange: 'BINANCE', type: 'crypto', basePrice: 43500, tickSize: 0.01, lotSize: 0.001, currency: '$' },
  { symbol: 'ETHUSDT', name: 'Ethereum / USDT', exchange: 'BINANCE', type: 'crypto', basePrice: 2280, tickSize: 0.01, lotSize: 0.01, currency: '$' },
  { symbol: 'SOLUSDT', name: 'Solana / USDT', exchange: 'BINANCE', type: 'crypto', basePrice: 102, tickSize: 0.01, lotSize: 0.1, currency: '$' },
  { symbol: 'BNBUSDT', name: 'BNB / USDT', exchange: 'BINANCE', type: 'crypto', basePrice: 310, tickSize: 0.01, lotSize: 0.01, currency: '$' },

  // Forex
  { symbol: 'EURUSD', name: 'Euro / US Dollar', exchange: 'FOREX', type: 'forex', basePrice: 1.0850, tickSize: 0.0001, lotSize: 100000, currency: '$' },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', exchange: 'FOREX', type: 'forex', basePrice: 1.2650, tickSize: 0.0001, lotSize: 100000, currency: '$' },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', exchange: 'FOREX', type: 'forex', basePrice: 149.50, tickSize: 0.01, lotSize: 100000, currency: '¥' },
  { symbol: 'USDINR', name: 'US Dollar / Indian Rupee', exchange: 'FOREX', type: 'forex', basePrice: 83.25, tickSize: 0.0025, lotSize: 1000, currency: '₹' },
];

export function searchSymbols(query: string): SymbolInfo[] {
  if (!query.trim()) return SYMBOLS;
  const q = query.toLowerCase().trim();
  return SYMBOLS.filter(s =>
    s.symbol.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q) ||
    s.exchange.toLowerCase().includes(q) ||
    s.type.toLowerCase().includes(q)
  );
}

export function getSymbolInfo(symbol: string): SymbolInfo | undefined {
  return SYMBOLS.find(s => s.symbol === symbol);
}

export function getTypeColor(type: SymbolInfo['type']): string {
  switch (type) {
    case 'futures': return 'text-yellow-400 bg-yellow-500/15';
    case 'stock': return 'text-blue-400 bg-blue-500/15';
    case 'index': return 'text-purple-400 bg-purple-500/15';
    case 'crypto': return 'text-orange-400 bg-orange-500/15';
    case 'forex': return 'text-green-400 bg-green-500/15';
    case 'commodity': return 'text-amber-400 bg-amber-500/15';
    default: return 'text-gray-400 bg-gray-500/15';
  }
}

export function getTypeIcon(type: SymbolInfo['type']): string {
  switch (type) {
    case 'futures': return '⚡';
    case 'stock': return '📈';
    case 'index': return '📊';
    case 'crypto': return '₿';
    case 'forex': return '💱';
    case 'commodity': return '🛢️';
    default: return '📋';
  }
}
