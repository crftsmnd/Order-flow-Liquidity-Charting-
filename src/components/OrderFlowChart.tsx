import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { CandleData } from '../data/marketData';
import { getLiquidityColor, type LiquidityCandle, type LiquiditySettings } from '../data/liquidityData';

interface OrderFlowChartProps {
  data: CandleData[];
  showOrderFlow: boolean;
  showDelta: boolean;
  showVolume: boolean;
  showPOC: boolean;
  liquidityData: LiquidityCandle[];
  liquiditySettings: LiquiditySettings;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  pane: 'chart' | 'volume' | 'delta' | 'priceAxis' | null;
}

export function OrderFlowChart({
  data, showOrderFlow, showDelta, showVolume, showPOC,
  liquidityData, liquiditySettings,
}: OrderFlowChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Zoom & pan state
  const [hOffset, setHOffset] = useState(0);
  const [candleWidth, setCandleWidth] = useState(showOrderFlow ? 80 : 14);

  // Vertical zoom/pan for main chart
  const [vZoom, setVZoom] = useState(1);
  const [vOffset, setVOffset] = useState(0);

  // Price axis drag state
  const [priceAxisDragging, setPriceAxisDragging] = useState(false);
  const priceAxisDragStartY = useRef(0);
  const priceAxisDragStartZoom = useRef(1);

  // Pane resize
  const [volumePaneHeight, setVolumePaneHeight] = useState(80);
  const [deltaPaneHeight, setDeltaPaneHeight] = useState(50);
  const [resizingPane, setResizingPane] = useState<'volume' | 'delta' | null>(null);
  const resizeStartY = useRef(0);
  const resizeStartH = useRef(0);

  // Interaction state
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const dragState = useRef<DragState>({
    isDragging: false,
    startX: 0, startY: 0,
    lastX: 0, lastY: 0,
    pane: null,
  });

  // Pinch zoom
  const lastPinchDist = useRef<number | null>(null);

  const PRICE_AXIS_WIDTH = 72;
  const TIME_AXIS_HEIGHT = 28;
  const TOP_PADDING = 24;
  const PANE_HEADER = 18;

  const VOLUME_HEIGHT = showVolume ? volumePaneHeight : 0;
  const DELTA_HEIGHT = showDelta ? deltaPaneHeight : 0;

  useEffect(() => {
    setCandleWidth(showOrderFlow ? 80 : 14);
  }, [showOrderFlow]);

  useEffect(() => {
    setVZoom(1);
    setVOffset(0);
  }, [data.length > 0 ? Math.floor(data[0].timestamp / 60000) : 0]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new ResizeObserver(entries => {
      const e = entries[0];
      if (e) {
        setDimensions({
          width: Math.floor(e.contentRect.width),
          height: Math.floor(e.contentRect.height),
        });
      }
    });
    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  const gap = Math.max(2, candleWidth * 0.15);
  const totalCandleWidth = candleWidth + gap;
  const chartAreaWidth = dimensions.width - PRICE_AXIS_WIDTH;
  const visibleCandles = Math.max(1, Math.floor(chartAreaWidth / totalCandleWidth));
  const maxScroll = Math.max(0, data.length - Math.floor(visibleCandles * 0.3));
  const clampedHOffset = Math.max(0, Math.min(hOffset, maxScroll));
  const chartHeight = dimensions.height - TIME_AXIS_HEIGHT - VOLUME_HEIGHT - DELTA_HEIGHT - TOP_PADDING
    - (showVolume ? PANE_HEADER : 0) - (showDelta ? PANE_HEADER : 0);

  // Compute the visible data slice indices
  const visibleEnd = data.length - clampedHOffset;
  const visibleStart = Math.max(0, visibleEnd - visibleCandles - 2);

  const visibleData = useMemo(() => {
    return data.slice(visibleStart, visibleEnd);
  }, [data, visibleStart, visibleEnd]);

  // Visible liquidity data (matching candle indices)
  const visibleLiquidity = useMemo(() => {
    if (!liquiditySettings.enabled || liquidityData.length === 0) return [];
    return liquidityData.slice(visibleStart, visibleEnd);
  }, [liquidityData, liquiditySettings.enabled, visibleStart, visibleEnd]);

  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (visibleData.length === 0) return { minPrice: 0, maxPrice: 0, priceRange: 1 };
    let min = Infinity, max = -Infinity;
    visibleData.forEach(c => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });
    const padding = (max - min) * 0.08;
    min -= padding;
    max += padding;
    return { minPrice: min, maxPrice: max, priceRange: max - min };
  }, [visibleData]);

  const effectivePriceRange = priceRange / vZoom;
  const midPrice = (minPrice + maxPrice) / 2 + (vOffset / chartHeight) * priceRange;
  const effectiveMinPrice = midPrice - effectivePriceRange / 2;
  const effectiveMaxPrice = midPrice + effectivePriceRange / 2;

  const priceToY = useCallback((price: number) => {
    return TOP_PADDING + chartHeight - ((price - effectiveMinPrice) / effectivePriceRange) * chartHeight;
  }, [chartHeight, effectiveMinPrice, effectivePriceRange]);

  const yToPrice = useCallback((y: number) => {
    return effectiveMaxPrice - ((y - TOP_PADDING) / chartHeight) * effectivePriceRange;
  }, [chartHeight, effectiveMaxPrice, effectivePriceRange]);

  const getPaneAtY = useCallback((y: number): 'chart' | 'volume' | 'delta' | null => {
    const chartBottom = TOP_PADDING + chartHeight;
    if (y >= TOP_PADDING && y < chartBottom) return 'chart';

    let currentY = chartBottom;
    if (showVolume) {
      const volTop = currentY + PANE_HEADER;
      const volBottom = volTop + VOLUME_HEIGHT - PANE_HEADER;
      if (y >= currentY - 4 && y <= currentY + 4) return null;
      if (y >= volTop && y <= volBottom) return 'volume';
      currentY = volTop + VOLUME_HEIGHT - PANE_HEADER;
    }
    if (showDelta) {
      const delTop = currentY + PANE_HEADER;
      const delBottom = delTop + DELTA_HEIGHT - PANE_HEADER;
      if (y >= currentY - 4 && y <= currentY + 4) return null;
      if (y >= delTop && y <= delBottom) return 'delta';
    }
    return null;
  }, [chartHeight, showVolume, showDelta, VOLUME_HEIGHT, DELTA_HEIGHT]);

  const getResizeHandleAtY = useCallback((y: number): 'volume' | 'delta' | null => {
    const chartBottom = TOP_PADDING + chartHeight;
    if (showVolume) {
      if (Math.abs(y - chartBottom) < 5) return 'volume';
    }
    if (showDelta) {
      let deltaSepY = TOP_PADDING + chartHeight;
      if (showVolume) deltaSepY += VOLUME_HEIGHT;
      if (Math.abs(y - deltaSepY) < 5) return 'delta';
    }
    return null;
  }, [chartHeight, showVolume, showDelta, VOLUME_HEIGHT]);

  const isOnPriceAxis = useCallback((x: number, y: number): boolean => {
    return x >= chartAreaWidth && y >= TOP_PADDING && y <= TOP_PADDING + chartHeight;
  }, [chartAreaWidth, chartHeight]);

  // ==================== DRAWING ====================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || visibleData.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    animFrameRef.current = requestAnimationFrame(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = dimensions.width * dpr;
      canvas.height = dimensions.height * dpr;
      ctx.scale(dpr, dpr);

      const W = dimensions.width;

      // Background
      ctx.fillStyle = '#0a0e17';
      ctx.fillRect(0, 0, W, dimensions.height);

      // === MAIN CHART AREA ===
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, TOP_PADDING, chartAreaWidth, chartHeight);
      ctx.clip();

      // Grid lines
      ctx.strokeStyle = '#131828';
      ctx.lineWidth = 0.5;
      const priceStep = calculatePriceStep(effectivePriceRange);
      const startPrice = Math.ceil(effectiveMinPrice / priceStep) * priceStep;

      for (let p = startPrice; p <= effectiveMaxPrice; p += priceStep) {
        const y = priceToY(p);
        if (y < TOP_PADDING || y > TOP_PADDING + chartHeight) continue;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartAreaWidth, y);
        ctx.stroke();
      }

      // ===== LIQUIDITY MAP HEATMAP LAYER (drawn BEFORE candles) =====
      if (liquiditySettings.enabled && visibleLiquidity.length > 0) {
        drawLiquidityMap(ctx, visibleLiquidity, visibleData, liquiditySettings, {
          totalCandleWidth,
          candleWidth,
          chartAreaWidth,
          chartHeight,
          TOP_PADDING,
          priceToY,
          effectiveMinPrice,
          effectiveMaxPrice,
        });
      }

      // Draw candles
      visibleData.forEach((candle, i) => {
        const x = i * totalCandleWidth;
        const centerX = x + totalCandleWidth / 2;
        if (centerX + candleWidth / 2 < 0 || centerX - candleWidth / 2 > chartAreaWidth) return;

        const isBullish = candle.close >= candle.open;
        const bullColor = '#00c853';
        const bearColor = '#ff1744';
        const candleColor = isBullish ? bullColor : bearColor;

        const openY = priceToY(candle.open);
        const closeY = priceToY(candle.close);
        const highY = priceToY(candle.high);
        const lowY = priceToY(candle.low);
        const bodyTop = Math.min(openY, closeY);
        const bodyBottom = Math.max(openY, closeY);
        const bodyHeight = Math.max(1, bodyBottom - bodyTop);

        if (showOrderFlow && candleWidth >= 40) {
          const flowWidth = candleWidth - 4;
          const halfFlow = flowWidth / 2;

          // Wick
          ctx.strokeStyle = candleColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX, highY);
          ctx.lineTo(centerX, lowY);
          ctx.stroke();

          // Body background
          ctx.fillStyle = isBullish ? 'rgba(0,200,83,0.08)' : 'rgba(255,23,68,0.08)';
          ctx.fillRect(centerX - halfFlow, highY, flowWidth, lowY - highY);

          ctx.strokeStyle = isBullish ? 'rgba(0,200,83,0.3)' : 'rgba(255,23,68,0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(centerX - halfFlow, highY, flowWidth, lowY - highY);

          // Order flow levels
          const maxLevelVol = Math.max(...candle.orderFlow.map(l => l.bidVolume + l.askVolume), 1);
          const numLevels = candle.orderFlow.length;
          const levelHeight = numLevels > 0 ? (lowY - highY) / numLevels : 0;

          candle.orderFlow.forEach((level, li) => {
            const ly = highY + (numLevels - 1 - li) * levelHeight;

            const bidWidth = (level.bidVolume / maxLevelVol) * halfFlow * 0.9;
            ctx.fillStyle = level.bidVolume > level.askVolume ? 'rgba(255,23,68,0.6)' : 'rgba(255,23,68,0.3)';
            ctx.fillRect(centerX - bidWidth, ly, bidWidth, Math.max(1, levelHeight - 1));

            const askWidth = (level.askVolume / maxLevelVol) * halfFlow * 0.9;
            ctx.fillStyle = level.askVolume > level.bidVolume ? 'rgba(0,200,83,0.6)' : 'rgba(0,200,83,0.3)';
            ctx.fillRect(centerX, ly, askWidth, Math.max(1, levelHeight - 1));

            if (levelHeight > 10 && candleWidth >= 60) {
              ctx.font = `${Math.min(9, levelHeight - 2)}px monospace`;
              ctx.textAlign = 'right';
              ctx.fillStyle = '#ff6b6b';
              ctx.fillText(String(level.bidVolume), centerX - 3, ly + levelHeight - 2);

              ctx.textAlign = 'left';
              ctx.fillStyle = '#69f0ae';
              ctx.fillText(String(level.askVolume), centerX + 3, ly + levelHeight - 2);
            }

            if (showPOC && level.price === candle.poc) {
              ctx.fillStyle = 'rgba(255,215,0,0.25)';
              ctx.fillRect(centerX - halfFlow, ly, flowWidth, Math.max(1, levelHeight - 1));
              ctx.strokeStyle = '#ffd700';
              ctx.lineWidth = 1;
              ctx.setLineDash([2, 2]);
              ctx.beginPath();
              ctx.moveTo(centerX - halfFlow, ly + levelHeight / 2);
              ctx.lineTo(centerX + halfFlow, ly + levelHeight / 2);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          });

          // Center divider
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(centerX, highY);
          ctx.lineTo(centerX, lowY);
          ctx.stroke();

          // Delta at top
          const d = candle.delta;
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = d >= 0 ? '#69f0ae' : '#ff6b6b';
          ctx.fillText((d >= 0 ? '+' : '') + d, centerX, highY - 3);
        } else {
          // Standard candlestick
          ctx.strokeStyle = candleColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX, highY);
          ctx.lineTo(centerX, lowY);
          ctx.stroke();

          const bodyW = Math.max(4, candleWidth - 4);
          if (isBullish) {
            ctx.strokeStyle = candleColor;
            ctx.lineWidth = 1;
            ctx.fillStyle = '#0a0e17';
            ctx.fillRect(centerX - bodyW / 2, bodyTop, bodyW, bodyHeight);
            ctx.strokeRect(centerX - bodyW / 2, bodyTop, bodyW, bodyHeight);
          } else {
            ctx.fillStyle = candleColor;
            ctx.fillRect(centerX - bodyW / 2, bodyTop, bodyW, bodyHeight);
          }
        }

        // Highlight hovered
        if (hoveredCandle === i) {
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fillRect(x, TOP_PADDING, totalCandleWidth, chartHeight);
        }
      });

      ctx.restore();

      // === PRICE AXIS ===
      const priceAxisBg = priceAxisDragging ? '#111827' : '#0c1018';
      ctx.fillStyle = priceAxisBg;
      ctx.fillRect(chartAreaWidth, TOP_PADDING, PRICE_AXIS_WIDTH, chartHeight);

      ctx.strokeStyle = priceAxisDragging ? '#3b82f6' : '#1e2538';
      ctx.lineWidth = priceAxisDragging ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(chartAreaWidth, TOP_PADDING);
      ctx.lineTo(chartAreaWidth, TOP_PADDING + chartHeight);
      ctx.stroke();

      for (let p = startPrice; p <= effectiveMaxPrice; p += priceStep) {
        const y = priceToY(p);
        if (y < TOP_PADDING || y > TOP_PADDING + chartHeight) continue;

        ctx.strokeStyle = '#1e2538';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chartAreaWidth, y);
        ctx.lineTo(chartAreaWidth + 4, y);
        ctx.stroke();

        ctx.fillStyle = '#6b7280';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(p.toFixed(2), W - 5, y + 3);
      }

      // Price axis drag indicator
      if (priceAxisDragging) {
        const axCenterX = chartAreaWidth + PRICE_AXIS_WIDTH / 2;
        const axCenterY = TOP_PADDING + chartHeight / 2;

        ctx.fillStyle = '#3b82f6';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(axCenterX, axCenterY - 30);
        ctx.lineTo(axCenterX - 6, axCenterY - 20);
        ctx.lineTo(axCenterX + 6, axCenterY - 20);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(axCenterX, axCenterY + 30);
        ctx.lineTo(axCenterX - 6, axCenterY + 20);
        ctx.lineTo(axCenterX + 6, axCenterY + 20);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#3b82f6';
        ctx.fillText(`${Math.round(vZoom * 100)}%`, axCenterX, axCenterY + 4);
      }

      // Current price line
      if (visibleData.length > 0) {
        const lastCandle = visibleData[visibleData.length - 1];
        const lastPriceY = priceToY(lastCandle.close);
        const lastColor = lastCandle.close >= lastCandle.open ? '#00c853' : '#ff1744';

        if (lastPriceY >= TOP_PADDING && lastPriceY <= TOP_PADDING + chartHeight) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, TOP_PADDING, chartAreaWidth, chartHeight);
          ctx.clip();
          ctx.strokeStyle = lastColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(0, lastPriceY);
          ctx.lineTo(chartAreaWidth, lastPriceY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        const tagY = Math.max(TOP_PADDING, Math.min(TOP_PADDING + chartHeight - 10, lastPriceY));
        ctx.fillStyle = lastColor;
        const tagX = chartAreaWidth;
        const tagW = PRICE_AXIS_WIDTH;
        const tagH = 20;
        const ty = tagY - tagH / 2;
        ctx.beginPath();
        ctx.moveTo(tagX, ty + 4);
        ctx.lineTo(tagX + 5, ty);
        ctx.lineTo(tagX + tagW, ty);
        ctx.lineTo(tagX + tagW, ty + tagH);
        ctx.lineTo(tagX + 5, ty + tagH);
        ctx.lineTo(tagX, ty + tagH - 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(lastCandle.close.toFixed(2), W - 5, tagY + 4);
      }

      // === INDICATOR PANES ===
      let paneY = TOP_PADDING + chartHeight;

      // --- VOLUME PANE ---
      if (showVolume) {
        const maxVol = Math.max(...visibleData.map(c => c.volume), 1);

        ctx.fillStyle = '#0c1018';
        ctx.fillRect(0, paneY, chartAreaWidth, PANE_HEADER);
        ctx.strokeStyle = '#1e2538';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, paneY);
        ctx.lineTo(W, paneY);
        ctx.stroke();

        ctx.fillStyle = '#6b7280';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('VOL', 5, paneY + 13);
        ctx.textAlign = 'right';
        ctx.fillText(maxVol.toLocaleString(), W - 5, paneY + 13);

        paneY += PANE_HEADER;
        const volPaneH = VOLUME_HEIGHT - PANE_HEADER;

        ctx.fillStyle = '#080c14';
        ctx.fillRect(0, paneY, chartAreaWidth, volPaneH);

        ctx.strokeStyle = '#111622';
        ctx.lineWidth = 0.5;
        for (let g = 0; g < 3; g++) {
          const gy = paneY + (volPaneH / 3) * g;
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(chartAreaWidth, gy);
          ctx.stroke();
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, paneY, chartAreaWidth, volPaneH);
        ctx.clip();

        visibleData.forEach((candle, i) => {
          const x = i * totalCandleWidth;
          const centerX = x + totalCandleWidth / 2;
          if (centerX + candleWidth / 2 < 0 || centerX - candleWidth / 2 > chartAreaWidth) return;

          const isBullish = candle.close >= candle.open;
          const volHeight = (candle.volume / maxVol) * volPaneH * 0.9;
          ctx.fillStyle = isBullish ? 'rgba(0,200,83,0.4)' : 'rgba(255,23,68,0.4)';
          const barW = Math.max(2, candleWidth - 4);
          ctx.fillRect(centerX - barW / 2, paneY + volPaneH - volHeight, barW, volHeight);

          if (hoveredCandle === i) {
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.fillRect(x, paneY, totalCandleWidth, volPaneH);
          }
        });

        ctx.restore();

        ctx.fillStyle = '#080c14';
        ctx.fillRect(chartAreaWidth, paneY, PRICE_AXIS_WIDTH, volPaneH);
        ctx.strokeStyle = '#1e2538';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chartAreaWidth, paneY);
        ctx.lineTo(chartAreaWidth, paneY + volPaneH);
        ctx.stroke();

        paneY += volPaneH;
      }

      // --- DELTA PANE ---
      if (showDelta) {
        const maxDelta = Math.max(...visibleData.map(c => Math.abs(c.delta)), 1);

        ctx.fillStyle = '#0c1018';
        ctx.fillRect(0, paneY, chartAreaWidth, PANE_HEADER);
        ctx.strokeStyle = '#1e2538';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, paneY);
        ctx.lineTo(W, paneY);
        ctx.stroke();

        ctx.fillStyle = '#6b7280';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('DELTA', 5, paneY + 13);

        paneY += PANE_HEADER;
        const deltaPaneH = DELTA_HEIGHT - PANE_HEADER;

        ctx.fillStyle = '#080c14';
        ctx.fillRect(0, paneY, chartAreaWidth, deltaPaneH);

        const zeroY = paneY + deltaPaneH / 2;
        ctx.strokeStyle = '#1e2538';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, zeroY);
        ctx.lineTo(chartAreaWidth, zeroY);
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, paneY, chartAreaWidth, deltaPaneH);
        ctx.clip();

        visibleData.forEach((candle, i) => {
          const x = i * totalCandleWidth;
          const centerX = x + totalCandleWidth / 2;
          if (centerX + candleWidth / 2 < 0 || centerX - candleWidth / 2 > chartAreaWidth) return;

          const deltaH = (Math.abs(candle.delta) / maxDelta) * (deltaPaneH / 2) * 0.9;
          const barW = Math.max(2, candleWidth - 4);

          if (candle.delta >= 0) {
            ctx.fillStyle = 'rgba(0,200,83,0.5)';
            ctx.fillRect(centerX - barW / 2, zeroY - deltaH, barW, deltaH);
          } else {
            ctx.fillStyle = 'rgba(255,23,68,0.5)';
            ctx.fillRect(centerX - barW / 2, zeroY, barW, deltaH);
          }

          if (hoveredCandle === i) {
            ctx.fillStyle = 'rgba(255,255,255,0.03)';
            ctx.fillRect(x, paneY, totalCandleWidth, deltaPaneH);
          }
        });

        ctx.restore();

        ctx.fillStyle = '#080c14';
        ctx.fillRect(chartAreaWidth, paneY, PRICE_AXIS_WIDTH, deltaPaneH);
        ctx.strokeStyle = '#1e2538';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chartAreaWidth, paneY);
        ctx.lineTo(chartAreaWidth, paneY + deltaPaneH);
        ctx.stroke();

        paneY += deltaPaneH;
      }

      // === TIME AXIS ===
      ctx.fillStyle = '#0c1018';
      ctx.fillRect(0, paneY, W, TIME_AXIS_HEIGHT);
      ctx.strokeStyle = '#1e2538';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, paneY);
      ctx.lineTo(W, paneY);
      ctx.stroke();

      visibleData.forEach((candle, i) => {
        const x = i * totalCandleWidth + totalCandleWidth / 2;
        if (x < 0 || x > chartAreaWidth) return;
        const labelInterval = Math.max(1, Math.floor(visibleCandles / 10));
        if (i % labelInterval === 0) {
          ctx.strokeStyle = '#131828';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x, TOP_PADDING);
          ctx.lineTo(x, paneY);
          ctx.stroke();

          ctx.fillStyle = '#6b7280';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(candle.date, x, paneY + 14);
        }
      });

      // === CROSSHAIR ===
      if (hoveredCandle !== null && mousePos.x < chartAreaWidth && mousePos.x > 0) {
        const totalChartBottom = paneY;

        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(mousePos.x, TOP_PADDING);
        ctx.lineTo(mousePos.x, totalChartBottom);
        ctx.stroke();

        if (mousePos.y >= TOP_PADDING && mousePos.y <= TOP_PADDING + chartHeight) {
          ctx.beginPath();
          ctx.moveTo(0, mousePos.y);
          ctx.lineTo(chartAreaWidth, mousePos.y);
          ctx.stroke();

          const hoverPrice = yToPrice(mousePos.y);
          ctx.setLineDash([]);
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(chartAreaWidth, mousePos.y - 9, PRICE_AXIS_WIDTH, 18);
          ctx.fillStyle = '#fff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(hoverPrice.toFixed(2), W - 5, mousePos.y + 3);

          // Show liquidity info tooltip at crosshair
          if (liquiditySettings.enabled && visibleLiquidity.length > 0) {
            const candleIdx = Math.floor(mousePos.x / totalCandleWidth);
            if (candleIdx >= 0 && candleIdx < visibleLiquidity.length) {
              const liqCandle = visibleLiquidity[candleIdx];
              // Find nearest level
              let nearestLevel = liqCandle.levels[0];
              let minDist = Infinity;
              for (const lvl of liqCandle.levels) {
                const dist = Math.abs(lvl.price - hoverPrice);
                if (dist < minDist) {
                  minDist = dist;
                  nearestLevel = lvl;
                }
              }
              if (nearestLevel && nearestLevel.orders >= liquiditySettings.lowThreshold) {
                const tooltipX = mousePos.x + 12;
                const tooltipY = mousePos.y - 35;
                const tw2 = 115;
                const th2 = 48;

                ctx.fillStyle = 'rgba(13,17,32,0.95)';
                ctx.strokeStyle = '#2a3150';
                ctx.lineWidth = 1;
                roundRect(ctx, tooltipX, tooltipY, tw2, th2, 4);
                ctx.fill();
                ctx.stroke();

                ctx.font = '9px monospace';
                ctx.textAlign = 'left';
                ctx.fillStyle = '#9ca3af';
                ctx.fillText('Pending Orders', tooltipX + 5, tooltipY + 12);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px monospace';
                ctx.fillText(`${nearestLevel.orders} orders`, tooltipX + 5, tooltipY + 25);
                ctx.font = '9px monospace';
                ctx.fillStyle = '#4ade80';
                ctx.fillText(`B:${nearestLevel.buyOrders}`, tooltipX + 5, tooltipY + 38);
                ctx.fillStyle = '#f87171';
                ctx.fillText(`S:${nearestLevel.sellOrders}`, tooltipX + 50, tooltipY + 38);
              }
            }
          }
        }

        ctx.setLineDash([]);

        const candleIdx = Math.floor(mousePos.x / totalCandleWidth);
        if (candleIdx >= 0 && candleIdx < visibleData.length) {
          const timeX = candleIdx * totalCandleWidth + totalCandleWidth / 2;
          ctx.fillStyle = '#3b82f6';
          const tw = 60;
          ctx.fillRect(timeX - tw / 2, totalChartBottom + 2, tw, 16);
          ctx.fillStyle = '#fff';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(visibleData[candleIdx].date, timeX, totalChartBottom + 13);
        }
      }

      // === Pane resize handles ===
      const drawResizeHandle = (hy: number) => {
        ctx.fillStyle = '#2a3150';
        ctx.fillRect(chartAreaWidth / 2 - 15, hy - 2, 30, 4);
        ctx.fillStyle = '#4a5580';
        ctx.fillRect(chartAreaWidth / 2 - 10, hy - 1, 20, 2);
      };

      let sepY = TOP_PADDING + chartHeight;
      if (showVolume) {
        drawResizeHandle(sepY);
        sepY += VOLUME_HEIGHT;
      }
      if (showDelta) {
        drawResizeHandle(sepY);
      }

      // Price axis grab hint
      if (!priceAxisDragging) {
        const axCenterX = chartAreaWidth + PRICE_AXIS_WIDTH / 2;
        const axBottom = TOP_PADDING + chartHeight - 8;
        ctx.fillStyle = '#2a3150';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(axCenterX, axBottom - 6);
        ctx.lineTo(axCenterX - 4, axBottom - 2);
        ctx.lineTo(axCenterX + 4, axBottom - 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(axCenterX, axBottom + 6);
        ctx.lineTo(axCenterX - 4, axBottom + 2);
        ctx.lineTo(axCenterX + 4, axBottom + 2);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // === Liquidity legend (small) in top-right of chart area ===
      if (liquiditySettings.enabled) {
        const legX = chartAreaWidth - 130;
        const legY = TOP_PADDING + 4;
        ctx.fillStyle = 'rgba(10,14,23,0.85)';
        ctx.strokeStyle = '#1e2538';
        ctx.lineWidth = 1;
        roundRect(ctx, legX, legY, 125, 50, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText('🔥 LIQUIDITY MAP', legX + 4, legY + 10);

        const bars = [
          { label: 'Low', threshold: liquiditySettings.lowThreshold, color: getSchemePreviewColor(liquiditySettings.colorScheme, 0.15) },
          { label: 'Med', threshold: liquiditySettings.medThreshold, color: getSchemePreviewColor(liquiditySettings.colorScheme, 0.45) },
          { label: 'High', threshold: liquiditySettings.highThreshold, color: getSchemePreviewColor(liquiditySettings.colorScheme, 0.7) },
          { label: 'Ultra', threshold: liquiditySettings.ultraThreshold, color: getSchemePreviewColor(liquiditySettings.colorScheme, 1.0) },
        ];

        bars.forEach((b, bi) => {
          const bx = legX + 4 + bi * 30;
          const by = legY + 17;
          ctx.fillStyle = b.color;
          ctx.fillRect(bx, by, 24, 10);
          ctx.font = '7px monospace';
          ctx.fillStyle = '#9ca3af';
          ctx.textAlign = 'center';
          ctx.fillText(b.label, bx + 12, by + 22);
          ctx.fillStyle = '#6b7280';
          ctx.fillText(`≥${b.threshold}`, bx + 12, by + 30);
        });
      }
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [visibleData, visibleLiquidity, liquiditySettings, dimensions, hoveredCandle, mousePos,
    showOrderFlow, showDelta, showVolume, showPOC,
    candleWidth, totalCandleWidth, effectiveMinPrice, effectiveMaxPrice, effectivePriceRange,
    chartHeight, priceToY, yToPrice, visibleCandles, VOLUME_HEIGHT, DELTA_HEIGHT, chartAreaWidth,
    vZoom, vOffset, priceAxisDragging]);

  // ==================== INTERACTIONS ====================

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isOnPriceAxis(mouseX, mouseY)) {
      const zoomFactor = e.deltaY < 0 ? 1.06 : 0.94;
      setVZoom(z => Math.max(0.1, Math.min(20, z * zoomFactor)));
      return;
    }

    const pane = getPaneAtY(mouseY);

    if (e.ctrlKey || e.metaKey) {
      if (pane === 'chart') {
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.93;
        setVZoom(z => Math.max(0.1, Math.min(20, z * zoomFactor)));
      }
      if (pane === 'volume') {
        const delta = e.deltaY < 0 ? 5 : -5;
        setVolumePaneHeight(h => Math.max(40, Math.min(250, h + delta)));
      }
      if (pane === 'delta') {
        const delta = e.deltaY < 0 ? 5 : -5;
        setDeltaPaneHeight(h => Math.max(30, Math.min(200, h + delta)));
      }
    } else if (e.shiftKey) {
      const zoomDelta = e.deltaY > 0 ? -4 : 4;
      const minW = showOrderFlow ? 40 : 4;
      const maxW = showOrderFlow ? 200 : 60;
      setCandleWidth(w => Math.max(minW, Math.min(maxW, w + zoomDelta)));
    } else {
      const scrollDelta = e.deltaY > 0 ? 3 : -3;
      setHOffset(o => Math.max(0, Math.min(maxScroll, o + scrollDelta)));
    }
  }, [maxScroll, showOrderFlow, getPaneAtY, isOnPriceAxis]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isOnPriceAxis(x, y)) {
      setPriceAxisDragging(true);
      priceAxisDragStartY.current = e.clientY;
      priceAxisDragStartZoom.current = vZoom;
      dragState.current = {
        isDragging: true,
        startX: e.clientX, startY: e.clientY,
        lastX: e.clientX, lastY: e.clientY,
        pane: 'priceAxis',
      };
      return;
    }

    const resizeHandle = getResizeHandleAtY(y);
    if (resizeHandle) {
      setResizingPane(resizeHandle);
      resizeStartY.current = e.clientY;
      resizeStartH.current = resizeHandle === 'volume' ? volumePaneHeight : deltaPaneHeight;
      return;
    }

    const pane = getPaneAtY(y);
    dragState.current = {
      isDragging: true,
      startX: e.clientX, startY: e.clientY,
      lastX: e.clientX, lastY: e.clientY,
      pane,
    };
  }, [getPaneAtY, getResizeHandleAtY, volumePaneHeight, deltaPaneHeight, isOnPriceAxis, vZoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (priceAxisDragging && dragState.current.pane === 'priceAxis') {
      const dy = e.clientY - priceAxisDragStartY.current;
      const sensitivity = 0.006;
      const zoomMultiplier = 1 + (-dy * sensitivity);
      const newZoom = priceAxisDragStartZoom.current * Math.max(0.1, Math.min(20, zoomMultiplier));
      setVZoom(Math.max(0.1, Math.min(20, newZoom)));
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = 'ns-resize';
      return;
    }

    if (resizingPane) {
      const dy = e.clientY - resizeStartY.current;
      if (resizingPane === 'volume') {
        setVolumePaneHeight(Math.max(40, Math.min(250, resizeStartH.current + dy)));
      } else {
        setDeltaPaneHeight(Math.max(30, Math.min(200, resizeStartH.current + dy)));
      }
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const resizeHandle = getResizeHandleAtY(y);
      if (resizeHandle) {
        canvas.style.cursor = 'ns-resize';
      } else if (isOnPriceAxis(x, y)) {
        canvas.style.cursor = 'ns-resize';
      } else if (dragState.current.isDragging) {
        canvas.style.cursor = 'grabbing';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    }

    if (dragState.current.isDragging && dragState.current.pane !== 'priceAxis') {
      const dx = e.clientX - dragState.current.lastX;
      const dy = e.clientY - dragState.current.lastY;
      dragState.current.lastX = e.clientX;
      dragState.current.lastY = e.clientY;

      const pane = dragState.current.pane;

      if (Math.abs(dx) > 0) {
        const candlesDragged = dx / totalCandleWidth;
        setHOffset(o => Math.max(0, Math.min(maxScroll, o + candlesDragged)));
      }

      if (pane === 'chart' && Math.abs(dy) > 0) {
        setVOffset(off => off + dy);
      }

      return;
    }

    const candleIndex = Math.floor(x / totalCandleWidth);
    if (candleIndex >= 0 && candleIndex < visibleData.length && x < chartAreaWidth) {
      setHoveredCandle(candleIndex);
    } else {
      setHoveredCandle(null);
    }
  }, [totalCandleWidth, visibleData.length, maxScroll, chartAreaWidth, resizingPane, getResizeHandleAtY,
    priceAxisDragging, isOnPriceAxis]);

  const handleMouseUp = useCallback(() => {
    dragState.current.isDragging = false;
    dragState.current.pane = null;
    setPriceAxisDragging(false);
    setResizingPane(null);
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = 'crosshair';
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCandle(null);
    dragState.current.isDragging = false;
    dragState.current.pane = null;
    setPriceAxisDragging(false);
    setResizingPane(null);
  }, []);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1) {
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;

      if (isOnPriceAxis(x, y)) {
        setPriceAxisDragging(true);
        priceAxisDragStartY.current = e.touches[0].clientY;
        priceAxisDragStartZoom.current = vZoom;
        dragState.current = {
          isDragging: true,
          startX: e.touches[0].clientX, startY: e.touches[0].clientY,
          lastX: e.touches[0].clientX, lastY: e.touches[0].clientY,
          pane: 'priceAxis',
        };
        return;
      }

      const pane = getPaneAtY(y);
      dragState.current = {
        isDragging: true,
        startX: e.touches[0].clientX, startY: e.touches[0].clientY,
        lastX: e.touches[0].clientX, lastY: e.touches[0].clientY,
        pane,
      };
    }
  }, [getPaneAtY, isOnPriceAxis, vZoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (priceAxisDragging && e.touches.length === 1) {
      const dy = e.touches[0].clientY - priceAxisDragStartY.current;
      const sensitivity = 0.006;
      const zoomMultiplier = 1 + (-dy * sensitivity);
      const newZoom = priceAxisDragStartZoom.current * Math.max(0.1, Math.min(20, zoomMultiplier));
      setVZoom(Math.max(0.1, Math.min(20, newZoom)));
      return;
    }

    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / lastPinchDist.current;
      lastPinchDist.current = dist;

      const minW = showOrderFlow ? 40 : 4;
      const maxW = showOrderFlow ? 200 : 60;
      setCandleWidth(w => Math.max(minW, Math.min(maxW, w * scale)));
    } else if (e.touches.length === 1 && dragState.current.isDragging && dragState.current.pane !== 'priceAxis') {
      const dx = e.touches[0].clientX - dragState.current.lastX;
      const dy = e.touches[0].clientY - dragState.current.lastY;
      dragState.current.lastX = e.touches[0].clientX;
      dragState.current.lastY = e.touches[0].clientY;

      const candlesDragged = dx / totalCandleWidth;
      setHOffset(o => Math.max(0, Math.min(maxScroll, o + candlesDragged)));

      if (dragState.current.pane === 'chart') {
        setVOffset(off => off + dy);
      }
    }
  }, [totalCandleWidth, maxScroll, showOrderFlow, priceAxisDragging]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = null;
    dragState.current.isDragging = false;
    dragState.current.pane = null;
    setPriceAxisDragging(false);
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isOnPriceAxis(x, y)) {
      setVZoom(1);
      setVOffset(0);
      return;
    }

    const pane = getPaneAtY(y);

    if (pane === 'chart') {
      setVZoom(1);
      setVOffset(0);
    } else if (pane === 'volume') {
      setVolumePaneHeight(80);
    } else if (pane === 'delta') {
      setDeltaPaneHeight(50);
    }
  }, [getPaneAtY, isOnPriceAxis]);

  const hoveredCandleData = hoveredCandle !== null ? visibleData[hoveredCandle] : null;
  const lastVisible = visibleData.length > 0 ? visibleData[visibleData.length - 1] : null;
  const displayCandle = hoveredCandleData || lastVisible;

  const zoomPercent = Math.round(vZoom * 100);

  return (
    <div ref={containerRef} className="relative flex-1 h-full overflow-hidden bg-[#0a0e17] no-select">
      {/* OHLCV Info Bar */}
      <div className="absolute top-0.5 left-2 z-10 flex items-center gap-3 text-[10px] font-mono pointer-events-none">
        {displayCandle && (
          <>
            <span className="text-gray-400">{displayCandle.date}</span>
            <span className="text-gray-400">O <span className="text-white">{displayCandle.open.toFixed(2)}</span></span>
            <span className="text-gray-400">H <span className="text-white">{displayCandle.high.toFixed(2)}</span></span>
            <span className="text-gray-400">L <span className="text-white">{displayCandle.low.toFixed(2)}</span></span>
            <span className="text-gray-400">C <span className={displayCandle.close >= displayCandle.open ? 'text-green-400' : 'text-red-400'}>{displayCandle.close.toFixed(2)}</span></span>
            <span className="text-gray-400">V <span className="text-blue-400">{displayCandle.volume.toLocaleString()}</span></span>
            <span className="text-gray-400">Δ <span className={displayCandle.delta >= 0 ? 'text-green-400' : 'text-red-400'}>{displayCandle.delta > 0 ? '+' : ''}{displayCandle.delta}</span></span>
          </>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-7 right-[78px] z-10 flex flex-col gap-1">
        <div className="flex items-center gap-0.5 bg-[#111827]/90 rounded border border-[#1e2538] overflow-hidden">
          <button
            onClick={() => {
              const minW = showOrderFlow ? 40 : 4;
              setCandleWidth(w => Math.max(minW, w - 6));
            }}
            className="px-1.5 py-0.5 text-gray-400 hover:text-white hover:bg-[#1e2538] text-[11px] transition-colors"
            title="Zoom out horizontally"
          >
            −
          </button>
          <span className="px-1 text-[8px] text-gray-500 font-mono min-w-[18px] text-center">
            H
          </span>
          <button
            onClick={() => {
              const maxW = showOrderFlow ? 200 : 60;
              setCandleWidth(w => Math.min(maxW, w + 6));
            }}
            className="px-1.5 py-0.5 text-gray-400 hover:text-white hover:bg-[#1e2538] text-[11px] transition-colors"
            title="Zoom in horizontally"
          >
            +
          </button>
        </div>
        <div className="flex items-center gap-0.5 bg-[#111827]/90 rounded border border-[#1e2538] overflow-hidden">
          <button
            onClick={() => setVZoom(z => Math.max(0.1, z * 0.9))}
            className="px-1.5 py-0.5 text-gray-400 hover:text-white hover:bg-[#1e2538] text-[11px] transition-colors"
            title="Zoom out vertically"
          >
            −
          </button>
          <span className="px-1 text-[8px] text-gray-500 font-mono min-w-[18px] text-center">
            {zoomPercent}%
          </span>
          <button
            onClick={() => setVZoom(z => Math.min(20, z * 1.1))}
            className="px-1.5 py-0.5 text-gray-400 hover:text-white hover:bg-[#1e2538] text-[11px] transition-colors"
            title="Zoom in vertically"
          >
            +
          </button>
        </div>
        <button
          onClick={() => {
            setVZoom(1);
            setVOffset(0);
            setHOffset(0);
            setCandleWidth(showOrderFlow ? 80 : 14);
            setVolumePaneHeight(80);
            setDeltaPaneHeight(50);
          }}
          className="px-1.5 py-0.5 bg-[#111827]/90 rounded border border-[#1e2538] text-[9px] text-gray-400 hover:text-white hover:bg-[#1e2538] transition-colors font-mono"
          title="Reset all zoom & pan"
        >
          ⌂ Reset
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-1 left-2 z-10 text-[8px] font-mono text-gray-600 pointer-events-none flex gap-3">
        <span>Scroll: Pan</span>
        <span>Shift+Scroll: H-Zoom</span>
        <span>Ctrl+Scroll: V-Zoom</span>
        <span>Drag: Pan</span>
        <span>Price Axis Drag: V-Zoom</span>
        <span>Dbl-click: Reset</span>
      </div>

      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ width: dimensions.width, height: dimensions.height }}
        className="cursor-crosshair"
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}

// ==================== LIQUIDITY MAP DRAWING ====================

interface DrawParams {
  totalCandleWidth: number;
  candleWidth: number;
  chartAreaWidth: number;
  chartHeight: number;
  TOP_PADDING: number;
  priceToY: (price: number) => number;
  effectiveMinPrice: number;
  effectiveMaxPrice: number;
}

function drawLiquidityMap(
  ctx: CanvasRenderingContext2D,
  liquidityCandles: LiquidityCandle[],
  _visibleData: CandleData[],
  settings: LiquiditySettings,
  params: DrawParams,
) {
  const { totalCandleWidth, candleWidth, chartAreaWidth, chartHeight, TOP_PADDING, priceToY, effectiveMinPrice, effectiveMaxPrice } = params;

  // For each visible candle, draw liquidity cells
  liquidityCandles.forEach((liqCandle, i) => {
    const x = i * totalCandleWidth;
    const centerX = x + totalCandleWidth / 2;
    if (centerX + candleWidth / 2 < 0 || centerX - candleWidth / 2 > chartAreaWidth) return;

    const cellWidth = candleWidth + 2; // slightly wider than candle for full coverage
    const levels = liqCandle.levels;
    if (levels.length < 2) return;

    // Price step between levels
    const pStep = levels.length > 1 ? levels[1].price - levels[0].price : 1;

    for (const level of levels) {
      // Skip if outside visible price range
      if (level.price < effectiveMinPrice - pStep || level.price > effectiveMaxPrice + pStep) continue;

      const color = getLiquidityColor(level.orders, level.buyOrders, level.sellOrders, settings);
      if (!color) continue;

      const yTop = priceToY(level.price + pStep / 2);
      const yBottom = priceToY(level.price - pStep / 2);
      const cellHeight = Math.max(1, yBottom - yTop);

      // Clamp to chart area
      const clampedTop = Math.max(TOP_PADDING, yTop);
      const clampedBottom = Math.min(TOP_PADDING + chartHeight, yTop + cellHeight);
      if (clampedTop >= clampedBottom) continue;

      ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a})`;
      ctx.fillRect(
        centerX - cellWidth / 2,
        clampedTop,
        cellWidth,
        clampedBottom - clampedTop,
      );

      // Draw order count labels if enabled and cells are big enough
      if (settings.showLabels && cellHeight > 10 && candleWidth > 30 && level.orders >= settings.medThreshold) {
        ctx.save();
        ctx.font = `${Math.min(9, cellHeight - 2)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = level.orders >= settings.ultraThreshold ? '#fff' :
                        level.orders >= settings.highThreshold ? 'rgba(255,255,255,0.9)' :
                        'rgba(255,255,255,0.6)';
        const labelY = (clampedTop + clampedBottom) / 2 + 3;
        ctx.fillText(String(level.orders), centerX, labelY);
        ctx.restore();
      }
    }
  });
}

// ==================== HELPER FUNCTIONS ====================

function calculatePriceStep(range: number): number {
  const steps = [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000, 2500, 5000];
  const idealSteps = 8;
  const rawStep = range / idealSteps;
  for (const s of steps) {
    if (s >= rawStep) return s;
  }
  return steps[steps.length - 1];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getSchemePreviewColor(scheme: LiquiditySettings['colorScheme'], intensity: number): string {
  switch (scheme) {
    case 'heatmap':
      if (intensity < 0.25) return `rgba(20,68,180,${0.4 + intensity})`;
      if (intensity < 0.5) return `rgba(220,200,60,${0.4 + intensity})`;
      if (intensity < 0.75) return `rgba(240,100,32,${0.4 + intensity})`;
      return `rgba(255,64,80,${0.4 + intensity * 0.6})`;
    case 'bidask':
      if (intensity < 0.33) return `rgba(0,200,83,${0.4 + intensity})`;
      if (intensity < 0.66) return `rgba(255,171,0,${0.4 + intensity * 0.6})`;
      return `rgba(255,23,68,${0.4 + intensity * 0.6})`;
    case 'intensity':
      return `rgba(0,${Math.floor(150 * intensity)},${Math.floor(200 + 55 * intensity)},${0.3 + intensity * 0.7})`;
    case 'depth':
      return `rgba(${Math.floor(80 + 175 * intensity)},${Math.floor(20 + 40 * intensity)},${Math.floor(160 + 95 * intensity)},${0.3 + intensity * 0.7})`;
    default:
      return 'rgba(200,200,200,0.5)';
  }
}
