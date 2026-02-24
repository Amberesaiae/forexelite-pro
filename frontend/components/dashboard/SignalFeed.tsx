'use client';

import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Signal {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entryMin: number;
  entryMax: number;
  sl: number;
  tp: number;
  confidence: number;
  timeAgo: string;
}

const signals: Signal[] = [
  {
    id: '1',
    pair: 'EUR/USD',
    direction: 'BUY',
    entryMin: 1.082,
    entryMax: 1.084,
    sl: 1.075,
    tp: 1.095,
    confidence: 85,
    timeAgo: '2h ago',
  },
  {
    id: '2',
    pair: 'GBP/USD',
    direction: 'SELL',
    entryMin: 1.268,
    entryMax: 1.27,
    sl: 1.28,
    tp: 1.25,
    confidence: 78,
    timeAgo: '4h ago',
  },
  {
    id: '3',
    pair: 'XAU/USD',
    direction: 'BUY',
    entryMin: 2015,
    entryMax: 2020,
    sl: 1990,
    tp: 2060,
    confidence: 92,
    timeAgo: '1h ago',
  },
  {
    id: '4',
    pair: 'USD/JPY',
    direction: 'SELL',
    entryMin: 149.5,
    entryMax: 149.8,
    sl: 150.5,
    tp: 147.5,
    confidence: 65,
    timeAgo: '5h ago',
  },
  {
    id: '5',
    pair: 'AUD/USD',
    direction: 'BUY',
    entryMin: 0.652,
    entryMax: 0.655,
    sl: 0.645,
    tp: 0.67,
    confidence: 71,
    timeAgo: '6h ago',
  },
  {
    id: '6',
    pair: 'USD/CHF',
    direction: 'SELL',
    entryMin: 0.885,
    entryMax: 0.888,
    sl: 0.898,
    tp: 0.865,
    confidence: 58,
    timeAgo: '8h ago',
  },
];

function getConfidenceLevel(confidence: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (confidence >= 80) {
    return {
      label: 'High',
      color: 'text-[#C9A84C]',
      bgColor: 'bg-[#C9A84C]/10',
    };
  }
  if (confidence >= 60) {
    return {
      label: 'Medium',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    };
  }
  return {
    label: 'Low',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
  };
}

function formatPrice(price: number): string {
  if (price >= 100) {
    return price.toFixed(0);
  }
  if (price >= 10) {
    return price.toFixed(2);
  }
  return price.toFixed(3);
}

export default function SignalFeed() {
  return (
    <Card className="border-white/5 bg-[#090F1E]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg text-white">
          <span>Recent Signals</span>
          <span className="text-xs font-normal text-gray-400">
            {signals.length} signals
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {signals.map((signal) => {
          const confidence = getConfidenceLevel(signal.confidence);
          const isBuy = signal.direction === 'BUY';

          return (
            <div
              key={signal.id}
              className="group relative overflow-hidden rounded-lg border border-white/5 bg-[#0A1128] p-3 transition-colors hover:border-white/10"
            >
              <div
                className={`absolute left-0 top-0 h-full w-1 ${
                  isBuy ? 'bg-green-500' : 'bg-red-500'
                }`}
              />

              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-1 items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-white">
                    {signal.pair}
                  </span>
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                      isBuy
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {isBuy ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {signal.direction}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {signal.timeAgo}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Entry:</span>
                  <span className="font-mono text-gray-300">
                    {formatPrice(signal.entryMin)}-{formatPrice(signal.entryMax)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">SL:</span>
                  <span className="font-mono text-red-400">
                    {formatPrice(signal.sl)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">TP:</span>
                  <span className="font-mono text-green-400">
                    {formatPrice(signal.tp)}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div
                  className={`inline-flex items-center rounded px-2 py-1 ${confidence.bgColor}`}
                >
                  <span
                    className={`text-xs font-medium ${confidence.color}`}
                  >
                    {signal.confidence}% {confidence.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
