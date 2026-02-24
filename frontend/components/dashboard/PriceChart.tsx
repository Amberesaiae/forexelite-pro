"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from "lightweight-charts";

interface PriceChartProps {
  symbol: string;
  timeframe: string;
  onSymbolChange?: (symbol: string) => void;
  onTimeframeChange?: (tf: string) => void;
}

const symbols = ["EURUSD", "GBPUSD", "XAUUSD", "USDJPY", "GBPJPY"];
const timeframes = ["M5", "M15", "H1", "H4", "D1"];

const mockCandlestickData: Record<string, Record<string, CandlestickData[]>> = {
  EURUSD: {
    H1: [
      { time: "2026-02-20" as Time, open: 1.0800, high: 1.0825, low: 1.0790, close: 1.0815 },
      { time: "2026-02-21" as Time, open: 1.0815, high: 1.0840, low: 1.0805, close: 1.0830 },
      { time: "2026-02-22" as Time, open: 1.0830, high: 1.0855, low: 1.0820, close: 1.0845 },
      { time: "2026-02-23" as Time, open: 1.0845, high: 1.0860, low: 1.0835, close: 1.0845 },
    ],
  },
  GBPUSD: {
    H1: [
      { time: "2026-02-20" as Time, open: 1.2650, high: 1.2680, low: 1.2640, close: 1.2670 },
      { time: "2026-02-21" as Time, open: 1.2670, high: 1.2700, low: 1.2660, close: 1.2690 },
      { time: "2026-02-22" as Time, open: 1.2690, high: 1.2720, low: 1.2680, close: 1.2705 },
      { time: "2026-02-23" as Time, open: 1.2705, high: 1.2715, low: 1.2685, close: 1.2691 },
    ],
  },
  XAUUSD: {
    H1: [
      { time: "2026-02-20" as Time, open: 2010, high: 2025, low: 2005, close: 2020 },
      { time: "2026-02-21" as Time, open: 2020, high: 2035, low: 2015, close: 2030 },
      { time: "2026-02-22" as Time, open: 2030, high: 2045, low: 2028, close: 2040 },
      { time: "2026-02-23" as Time, open: 2040, high: 2045, low: 2030, close: 2034.5 },
    ],
  },
};

export function PriceChart({ symbol, timeframe, onSymbolChange, onTimeframeChange }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(1.08428);
  const [priceChange, setPriceChange] = useState<number>(0.42);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#090F1E" },
        textColor: "#8899BB",
      },
      grid: {
        vertLines: { color: "#131E32" },
        horzLines: { color: "#131E32" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "#C9A84C", width: 1, style: 2 },
        horzLine: { color: "#C9A84C", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "#131E32",
      },
      timeScale: {
        borderColor: "#131E32",
        timeVisible: true,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00E5A0",
      downColor: "#FF4560",
      borderUpColor: "#00E5A0",
      borderDownColor: "#FF4560",
      wickUpColor: "#00E5A0",
      wickDownColor: "#FF4560",
    });

    const data = mockCandlestickData[symbol]?.[timeframe] || mockCandlestickData[symbol]?.H1 || [];
    candlestickSeries.setData(data);

    if (data.length > 0) {
      const last = data[data.length - 1];
      setCurrentPrice(last.close);
      const first = data[0];
      setPriceChange(((last.close - first.open) / first.open) * 100);
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [symbol, timeframe]);

  return (
    <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
      <div className="flex items-center gap-3 mb-3">
        <select
          value={symbol}
          onChange={(e) => onSymbolChange?.(e.target.value)}
          className="font-mono text-[12px] font-semibold px-2 py-1 rounded"
          style={{ backgroundColor: "#0C1525", border: "1px solid #131E32", color: "#EEF2FF" }}
        >
          {symbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="font-mono text-[22px] font-medium" style={{ color: "#EEF2FF" }}>
          {currentPrice.toFixed(symbol.includes("JPY") ? 3 : 5)}
        </div>

        <span
          className="font-mono text-[11px] px-2 py-1 rounded"
          style={{
            backgroundColor: priceChange >= 0 ? "rgba(0, 229, 160, 0.1)" : "rgba(255, 69, 96, 0.1)",
            color: priceChange >= 0 ? "#00E5A0" : "#FF4560",
          }}
        >
          {priceChange >= 0 ? "+" : ""}
          {priceChange.toFixed(3)}%
        </span>

        <div className="ml-auto flex gap-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange?.(tf)}
              className="font-mono text-[10px] px-2 py-1 rounded transition-colors"
              style={{
                backgroundColor: timeframe === tf ? "rgba(201, 168, 76, 0.12)" : "transparent",
                border: `1px solid ${timeframe === tf ? "rgba(201,168,76,0.2)" : "transparent"}`,
                color: timeframe === tf ? "#C9A84C" : "#3F5070",
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div ref={chartContainerRef} className="w-full" style={{ height: "210px" }} />
    </div>
  );
}
