import { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tools = [
    { id: 'cursor', icon: '⊹', label: 'Cursor' },
    { id: 'crosshair', icon: '⊕', label: 'Crosshair' },
    { id: 'trendline', icon: '╱', label: 'Trend Line' },
    { id: 'hline', icon: '─', label: 'H-Line' },
    { id: 'rectangle', icon: '▭', label: 'Rectangle' },
    { id: 'fibonacci', icon: 'Fib', label: 'Fibonacci' },
    { id: 'text', icon: 'T', label: 'Text' },
    { id: 'measure', icon: '↕', label: 'Measure' },
  ];

  const [activeTool, setActiveTool] = useState('crosshair');

  return (
    <div className="flex flex-col w-10 bg-[#0b0f1a] border-r border-[#1e2538] items-center py-2 gap-1 shrink-0">
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          title={tool.label}
          className={`w-8 h-8 flex items-center justify-center rounded text-[11px] transition-colors ${
            activeTool === tool.id
              ? 'bg-blue-600/30 text-blue-300'
              : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a2035]'
          }`}
        >
          {tool.icon}
        </button>
      ))}

      <div className="flex-1" />

      {/* Panel toggles */}
      <div className="border-t border-[#1e2538] pt-2 flex flex-col gap-1">
        <button
          onClick={() => onTabChange(activeTab === 'orderbook' ? '' : 'orderbook')}
          title="Order Book"
          className={`w-8 h-8 flex items-center justify-center rounded text-[9px] font-bold transition-colors ${
            activeTab === 'orderbook'
              ? 'bg-green-600/30 text-green-300'
              : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a2035]'
          }`}
        >
          OB
        </button>
        <button
          onClick={() => onTabChange(activeTab === 'trades' ? '' : 'trades')}
          title="Recent Trades"
          className={`w-8 h-8 flex items-center justify-center rounded text-[9px] font-bold transition-colors ${
            activeTab === 'trades'
              ? 'bg-orange-600/30 text-orange-300'
              : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a2035]'
          }`}
        >
          T&S
        </button>
        <button
          onClick={() => onTabChange(activeTab === 'info' ? '' : 'info')}
          title="Info"
          className={`w-8 h-8 flex items-center justify-center rounded text-[9px] font-bold transition-colors ${
            activeTab === 'info'
              ? 'bg-purple-600/30 text-purple-300'
              : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a2035]'
          }`}
        >
          ℹ
        </button>
      </div>
    </div>
  );
}
