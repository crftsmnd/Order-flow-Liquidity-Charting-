import { useState } from 'react';
import type { LiquiditySettings as LiqSettings } from '../data/liquidityData';

interface LiquiditySettingsProps {
  settings: LiqSettings;
  onUpdate: (settings: LiqSettings) => void;
  onClose: () => void;
}

export function LiquiditySettings({ settings, onUpdate, onClose }: LiquiditySettingsProps) {
  const [local, setLocal] = useState<LiqSettings>({ ...settings });

  const update = (patch: Partial<LiqSettings>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onUpdate(next);
  };

  const colorSchemes: { id: LiqSettings['colorScheme']; label: string; desc: string; preview: string[] }[] = [
    { id: 'heatmap', label: 'Heatmap', desc: 'Blue → Yellow → Red → White', preview: ['#1444b4', '#dcc83c', '#f06420', '#ff4050'] },
    { id: 'bidask', label: 'Bid/Ask', desc: 'Green(Buy) / Red(Sell) / Yellow(Mixed)', preview: ['#00c853', '#ffab00', '#ff1744', '#ff6b6b'] },
    { id: 'intensity', label: 'Intensity', desc: 'Cyan with varying brightness', preview: ['#002840', '#005580', '#0099cc', '#3cffff'] },
    { id: 'depth', label: 'Depth', desc: 'Purple → Magenta → Pink', preview: ['#5014a0', '#a028b0', '#d040c8', '#ff60f0'] },
  ];

  const presets = [
    { label: 'Scalping', low: 3, med: 10, high: 25, ultra: 60, opacity: 0.7, resolution: 40 },
    { label: 'Day Trading', low: 5, med: 20, high: 50, ultra: 100, opacity: 0.55, resolution: 30 },
    { label: 'Swing', low: 10, med: 40, high: 80, ultra: 200, opacity: 0.5, resolution: 20 },
    { label: 'Whale Watch', low: 30, med: 60, high: 120, ultra: 250, opacity: 0.65, resolution: 25 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-[460px] max-h-[85vh] bg-[#0d1120] border border-[#1e2538] rounded-xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2538] bg-[#0f1320]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm">
              🔥
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Liquidity Map Settings</h3>
              <p className="text-[9px] text-gray-500">Configure pending order heatmap visualization</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* Presets */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Presets</label>
            <div className="grid grid-cols-4 gap-1.5">
              {presets.map(p => (
                <button
                  key={p.label}
                  onClick={() => update({
                    lowThreshold: p.low,
                    medThreshold: p.med,
                    highThreshold: p.high,
                    ultraThreshold: p.ultra,
                    opacity: p.opacity,
                    resolution: p.resolution,
                  })}
                  className="px-2 py-1.5 rounded-md text-[10px] font-medium bg-[#1a2035] text-gray-400 hover:text-white hover:bg-[#2a3150] border border-[#1e2538] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enable toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">Enable Liquidity Map</span>
            <button
              onClick={() => update({ enabled: !local.enabled })}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                local.enabled ? 'bg-blue-600' : 'bg-[#1e2538]'
              }`}
            >
              <div className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-transform ${
                local.enabled ? 'left-5.5 translate-x-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>

          {/* Color Scheme */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Color Scheme</label>
            <div className="grid grid-cols-2 gap-2">
              {colorSchemes.map(cs => (
                <button
                  key={cs.id}
                  onClick={() => update({ colorScheme: cs.id })}
                  className={`flex flex-col items-start p-2.5 rounded-lg border transition-all ${
                    local.colorScheme === cs.id
                      ? 'border-blue-500/60 bg-blue-500/10'
                      : 'border-[#1e2538] bg-[#0a0e17] hover:border-[#2a3150]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex">
                      {cs.preview.map((c, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 rounded-sm -ml-0.5 first:ml-0"
                          style={{ backgroundColor: c, opacity: 0.3 + (i * 0.23) }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-white font-medium">{cs.label}</span>
                  </div>
                  <span className="text-[9px] text-gray-500">{cs.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Threshold Settings */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Order Thresholds
            </label>
            <div className="space-y-3">
              {/* Visual threshold bar */}
              <div className="relative h-6 bg-[#0a0e17] rounded-lg overflow-hidden border border-[#1e2538]">
                <div className="absolute inset-0 flex">
                  <div
                    className="h-full opacity-30"
                    style={{
                      width: `${(local.lowThreshold / local.ultraThreshold) * 100}%`,
                      backgroundColor: '#1444b4',
                    }}
                  />
                  <div
                    className="h-full opacity-40"
                    style={{
                      width: `${((local.medThreshold - local.lowThreshold) / local.ultraThreshold) * 100}%`,
                      backgroundColor: '#dcc83c',
                    }}
                  />
                  <div
                    className="h-full opacity-60"
                    style={{
                      width: `${((local.highThreshold - local.medThreshold) / local.ultraThreshold) * 100}%`,
                      backgroundColor: '#f06420',
                    }}
                  />
                  <div
                    className="h-full opacity-80"
                    style={{
                      width: `${((local.ultraThreshold - local.highThreshold) / local.ultraThreshold) * 100}%`,
                      backgroundColor: '#ff4050',
                    }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-between px-2 text-[8px] font-mono text-white/70">
                  <span>Low</span>
                  <span>Med</span>
                  <span>High</span>
                  <span>Ultra</span>
                </div>
              </div>

              <SliderRow
                label="Low (Min Visible)"
                value={local.lowThreshold}
                min={1}
                max={50}
                color="#3b82f6"
                onChange={(v) => update({ lowThreshold: Math.min(v, local.medThreshold - 1) })}
              />
              <SliderRow
                label="Medium"
                value={local.medThreshold}
                min={5}
                max={100}
                color="#eab308"
                onChange={(v) => update({ medThreshold: Math.max(local.lowThreshold + 1, Math.min(v, local.highThreshold - 1)) })}
              />
              <SliderRow
                label="High"
                value={local.highThreshold}
                min={10}
                max={200}
                color="#f97316"
                onChange={(v) => update({ highThreshold: Math.max(local.medThreshold + 1, Math.min(v, local.ultraThreshold - 1)) })}
              />
              <SliderRow
                label="Ultra (Whale)"
                value={local.ultraThreshold}
                min={20}
                max={500}
                color="#ef4444"
                onChange={(v) => update({ ultraThreshold: Math.max(local.highThreshold + 1, v) })}
              />
            </div>
          </div>

          {/* Opacity & Resolution */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Opacity</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={Math.round(local.opacity * 100)}
                  onChange={(e) => update({ opacity: parseInt(e.target.value) / 100 })}
                  className="flex-1 h-1.5 bg-[#1e2538] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[10px] text-gray-400 font-mono w-8 text-right">{Math.round(local.opacity * 100)}%</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Resolution</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={local.resolution}
                  onChange={(e) => update({ resolution: parseInt(e.target.value) })}
                  className="flex-1 h-1.5 bg-[#1e2538] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-[10px] text-gray-400 font-mono w-8 text-right">{local.resolution}</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Filter</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={local.showBuyLiquidity}
                  onChange={(e) => update({ showBuyLiquidity: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-[#1e2538] bg-[#0a0e17] accent-green-500"
                />
                <span className="text-xs text-green-400">Buy Orders</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={local.showSellLiquidity}
                  onChange={(e) => update({ showSellLiquidity: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-[#1e2538] bg-[#0a0e17] accent-red-500"
                />
                <span className="text-xs text-red-400">Sell Orders</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={local.showLabels}
                  onChange={(e) => update({ showLabels: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-[#1e2538] bg-[#0a0e17] accent-blue-500"
                />
                <span className="text-xs text-gray-400">Labels</span>
              </label>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-[#080c14] border border-[#1e2538] rounded-lg p-3">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Legend</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#1444b4', opacity: 0.6 }} />
                <span className="text-gray-400">Low: {local.lowThreshold}–{local.medThreshold - 1} orders</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#dcc83c', opacity: 0.7 }} />
                <span className="text-gray-400">Med: {local.medThreshold}–{local.highThreshold - 1} orders</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#f06420', opacity: 0.8 }} />
                <span className="text-gray-400">High: {local.highThreshold}–{local.ultraThreshold - 1} orders</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#ff4050', opacity: 0.9 }} />
                <span className="text-gray-400">Ultra: {local.ultraThreshold}+ orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#1e2538] bg-[#0f1320]">
          <button
            onClick={() => {
              const def: LiqSettings = {
                enabled: true, opacity: 0.55, lowThreshold: 5, medThreshold: 20,
                highThreshold: 50, ultraThreshold: 100, showBuyLiquidity: true,
                showSellLiquidity: true, colorScheme: 'heatmap', resolution: 30, showLabels: false,
              };
              setLocal(def);
              onUpdate(def);
            }}
            className="text-[10px] text-gray-500 hover:text-white transition-colors"
          >
            Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, color, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-gray-400 w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 h-1 bg-[#1e2538] rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
        }}
        className="w-12 px-1.5 py-0.5 text-[10px] text-white bg-[#0a0e17] border border-[#1e2538] rounded text-center font-mono focus:outline-none focus:border-blue-500/50"
      />
    </div>
  );
}
