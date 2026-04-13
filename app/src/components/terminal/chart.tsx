"use client";

import { useRef, useEffect, useCallback } from "react";
import { createChart, type IChartApi, type ISeriesApi, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import { GlassPanel } from "@/components/glass";
import { MARKET_CANDLES } from "@/lib/mock-trades";
import { useUiStore } from "@/stores";
import { cn } from "@/lib/utils";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;

interface ChartProps {
  marketId: string;
}

export function Chart({ marketId }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { chartTimeframe, setChartTimeframe } = useUiStore();

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#7a8ba8",
        fontFamily: "var(--font-data), monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)" },
        horzLines: { color: "rgba(255, 255, 255, 0.03)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(0, 217, 255, 0.3)",
          labelBackgroundColor: "#0a1628",
        },
        horzLine: {
          color: "rgba(0, 217, 255, 0.3)",
          labelBackgroundColor: "#0a1628",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
        textColor: "#7a8ba8",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    // Candlestick series (v5 API: chart.addSeries)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10B981",
      downColor: "#FF6B6B",
      borderUpColor: "#10B981",
      borderDownColor: "#FF6B6B",
      wickUpColor: "#10B98180",
      wickDownColor: "#FF6B6B80",
    });

    // Volume histogram
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    // Load candle data
    const candles = MARKET_CANDLES[marketId] || [];
    if (candles.length > 0) {
      candleSeries.setData(
        candles.map((c) => ({
          time: c.time as any,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );

      volumeSeries.setData(
        candles.map((c) => ({
          time: c.time as any,
          value: c.volume,
          color:
            c.close >= c.open
              ? "rgba(16, 185, 129, 0.2)"
              : "rgba(255, 107, 107, 0.2)",
        }))
      );
    }

    chart.timeScale().fitContent();

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
  }, [marketId]);

  // Initialize chart
  useEffect(() => {
    initChart();
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initChart]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (chartRef.current) {
          const { width, height } = entry.contentRect;
          chartRef.current.applyOptions({ width, height });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <GlassPanel tier={1} className="p-3 flex flex-col min-h-0">
      {/* Timeframe buttons */}
      <div className="flex items-center gap-1 mb-2 shrink-0">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => setChartTimeframe(tf)}
            className={cn(
              "px-2.5 py-1 text-xs font-mono rounded-lg transition-colors",
              chartTimeframe === tf
                ? "bg-cyan/15 text-cyan border border-cyan/25"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart container */}
      <div ref={containerRef} className="flex-1 min-h-[200px]" />
    </GlassPanel>
  );
}
