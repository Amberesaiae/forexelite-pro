"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from "lightweight-charts";

interface PriceChartProps {
  symbol: string;
  timeframe: string;
  onSymbolChange?: (symbol: string) => void;
  onTimeframeChange?: (tf: string) => void;
  candles?: CandlestickData[];
  isLoading?: boolean;
  isEmpty?: boolean;
}

const symbols = ["EURUSD", "GBPUSD", "XAUUSD", "USDJPY", "GBPJPY"];
const timeframes = ["M5", "M15", "H1", "H4", "D1"];

export function PriceChart({ symbol, timeframe, onSymbolChange, onTimeframeChange, candles, isLoading, isEmpty }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);

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
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;

    if (candles && candles.length > 0) {
      seriesRef.current.setData(candles);
      const last = candles[candles.length - 1];
      const first = candles[0];
      setCurrentPrice(last.close);
      setPriceChange(((last.close - first.open) / first.open) * 100);
      chartRef.current?.timeScale().fitContent();
    } else if (!isLoading) {
      seriesRef.current.setData([]);
      setCurrentPrice(0);
      setPriceChange(0);
    }
  }, [candles, isLoading]);

  if (isLoading) {
    return (
      <div style={{ backgroundColor: "#090F1E", border: "1px solid #131E32", borderRadius: "10px", padding: "16px" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-6 w-20 bg-[#131E32] animate-pulse rounded" />
          <div className="h-6 w-24 bg-[#131E32] animate-pulse rounded" />
          <div className="ml-auto h-6 w-32 bg-[#131E32] animate-pulse rounded" />
        </div>
        <div className="w-full flex items-center justify-center" style={{ height: "210px" }}>
          <div className="text-[12px]" style={{ color: "#3F5070" }}>Loading chart...</div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
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
            —
          </div>
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
        <div className="w-full flex flex-col items-center justify-center gap-2" style={{ height: "210px" }}>
          <div className="text-[14px]" style={{ color: "#C9A84C" }}>⚠️ MT5 Agent offline</div>
          <div className="text-[11px]" style={{ color: "#3F5070" }}>Prices unavailable. No candle data.</div>
        </div>
      </div>
    );
  }

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
          {currentPrice > 0 ? currentPrice.toFixed(symbol.includes("JPY") ? 3 : 5) : "—"}
        </div>

        {currentPrice > 0 && (
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
        )}

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
