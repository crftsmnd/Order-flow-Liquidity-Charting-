import { useState, useEffect, useRef, useCallback } from 'react';
import { searchSymbols, getTypeColor, getTypeIcon, type SymbolInfo } from '../data/symbols';

interface SymbolSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: SymbolInfo) => void;
  currentSymbol: string;
}

export function SymbolSearch({ isOpen, onClose, onSelect, currentSymbol }: SymbolSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SymbolInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'stock', label: 'Stocks' },
    { id: 'futures', label: 'Futures' },
    { id: 'index', label: 'Indices' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'forex', label: 'Forex' },
    { id: 'commodity', label: 'Commodities' },
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveFilter('all');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    let filtered = searchSymbols(query);
    if (activeFilter !== 'all') {
      filtered = filtered.filter(s => s.type === activeFilter);
    }
    setResults(filtered);
    setSelectedIndex(0);
  }, [query, activeFilter]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-symbol-item]');
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelect(results[selectedIndex]);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [results, selectedIndex, onSelect, onClose]);

  const handleSelect = useCallback((sym: SymbolInfo) => {
    onSelect(sym);
    onClose();
  }, [onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-[540px] max-h-[70vh] bg-[#0d1120] border border-[#1e2538] rounded-xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with search */}
        <div className="p-3 border-b border-[#1e2538]">
          <div className="relative flex items-center">
            <svg className="absolute left-3 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search symbol, name, or exchange..."
              className="w-full bg-[#0a0e17] border border-[#1e2538] rounded-lg pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 mt-2.5 overflow-x-auto no-scrollbar">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors ${
                  activeFilter === f.id
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a2035] border border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 120px)' }}>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No symbols found</p>
              <p className="text-xs mt-1 text-gray-600">Try a different search term</p>
            </div>
          ) : (
            results.map((sym, i) => {
              const isSelected = i === selectedIndex;
              const isCurrent = sym.symbol === currentSymbol;
              const typeColor = getTypeColor(sym.type);
              const typeIcon = getTypeIcon(sym.type);

              return (
                <div
                  key={sym.symbol}
                  data-symbol-item
                  onClick={() => handleSelect(sym)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`flex items-center px-3 py-2 cursor-pointer transition-colors border-b border-[#1e2538]/50 ${
                    isSelected ? 'bg-blue-600/10' : 'hover:bg-[#131828]'
                  } ${isCurrent ? 'border-l-2 border-l-blue-500' : ''}`}
                >
                  {/* Symbol icon */}
                  <div className="w-8 h-8 rounded-lg bg-[#1a2035] flex items-center justify-center text-sm mr-3 shrink-0">
                    {typeIcon}
                  </div>

                  {/* Symbol info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-semibold">{sym.symbol}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${typeColor}`}>
                        {sym.type}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-500/20 text-blue-400">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate mt-0.5">{sym.name}</div>
                  </div>

                  {/* Exchange & Price */}
                  <div className="text-right ml-3 shrink-0">
                    <div className="text-[10px] text-gray-400 font-mono">{sym.exchange}</div>
                    <div className="text-xs text-white font-mono mt-0.5">
                      {sym.currency}{sym.basePrice.toLocaleString(undefined, { minimumFractionDigits: sym.tickSize < 0.01 ? 4 : 2, maximumFractionDigits: sym.tickSize < 0.01 ? 4 : 2 })}
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  {isSelected && (
                    <svg className="w-4 h-4 ml-2 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#1e2538] text-[9px] text-gray-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 bg-[#1a2035] rounded text-gray-400">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1 py-0.5 bg-[#1a2035] rounded text-gray-400">Enter</kbd> Select</span>
            <span><kbd className="px-1 py-0.5 bg-[#1a2035] rounded text-gray-400">Esc</kbd> Close</span>
          </div>
          <span>{results.length} symbol{results.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}
