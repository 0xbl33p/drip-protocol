"use client";

import { useRef, useEffect, useCallback } from "react";
import { createChart, type IChartApi, ColorType, AreaSeries } from "lightweight-charts";
import { GlassPanel } from "@/components/glass";

/** Generate mock equity curve data */
function generateEquityCurve(baseEquity: number): { time: number; value: number }[] {
  const points: { time: number; value: number }[] = [];
  const now = 1776124800; // Fixed timestamp
  const start = now - 30 * 24 * 60 * 60; // 30 days ago

  let equity = baseEquity * 0.85; // Start lower
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 720; i++) { // 720 hourly points = 30 days
    const time = start + i * 3600;
    equity += (rand() - 0.47) * baseEquity * 0.01;
    equity = Math.max(baseEquity * 0.7, equity);
    points.push({ time, value: Math.round(equity * 100) / 100 });
  }

  return points;
}

interface PnlChartProps {
  equity: number;
}

export function PnlChart({ equity }: PnlChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

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
        vertLines: { color: "rgba(255, 255, 255, 0.02)" },
        horzLines: { color: "rgba(255, 255, 255, 0.02)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.06)",
        timeVisible: true,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#00D9FF",
      topColor: "rgba(0, 217, 255, 0.2)",
      bottomColor: "rgba(0, 217, 255, 0.0)",
      lineWidth: 2,
    });

    const data = generateEquityCurve(equity);
    series.setData(data.map((d) => ({ time: d.time as any, value: d.value })));

    chart.timeScale().fitContent();
    chartRef.current = chart;
  }, [equity]);

  useEffect(() => {
    initChart();
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initChart]);

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
    <GlassPanel tier={1} className="p-4">
      <div className="text-xs text-muted-foreground mb-2">Equity Curve (30d)</div>
      <div ref={containerRef} className="h-[200px]" />
    </GlassPanel>
  );
}
