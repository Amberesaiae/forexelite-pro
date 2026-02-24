"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  LineChart,
  BarChart3,
  Waves,
  Target,
  Zap,
  CircleDot,
  ArrowUpDown,
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  Clock,
  Crosshair,
  BarChart2,
} from "lucide-react";

interface Strategy {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  timeframe: string;
  winRate: string;
}

const smcStrategies: Strategy[] = [
  {
    id: "order-block",
    name: "Order Block Strategy",
    description: "Identify institutional order flow zones where smart money has placed large orders",
    icon: <BarChart3 className="w-5 h-5" />,
    details: [
      "Identify institutional order flow zones",
      "Trade from fresh order blocks after accumulation",
      "Use trend structure confirmation",
      "Entry at 50% retracement of OB",
    ],
    timeframe: "M15 - D1",
    winRate: "65-70%",
  },
  {
    id: "fair-value-gap",
    name: "Fair Value Gap (FVG)",
    description: "Trade imbalances where price has moved too quickly, creating inefficient zones",
    icon: <Waves className="w-5 h-5" />,
    details: [
      "Identify 3-candle FVG patterns",
      "Wait for price to retest FVG",
      "Confirm with market structure",
      "Use liquidity pools for targets",
    ],
    timeframe: "M5 - H4",
    winRate: "60-68%",
  },
  {
    id: "liquidity-sweep",
    name: "Liquidity Sweep Strategy",
    description: "Capture liquidity grabs that precede major market movements",
    icon: <Zap className="w-5 h-5" />,
    details: [
      "Map liquidity zones above/below price",
      "Wait for stop hunt/sweep pattern",
      "Enter on return to trend structure",
      "Set stop at liquidity high/low",
    ],
    timeframe: "M15 - H1",
    winRate: "58-65%",
  },
  {
    id: "displacement",
    name: "Displacement Strategy",
    description: "Trade strong momentum moves that displace previous market structure",
    icon: <TrendingUp className="w-5 h-5" />,
    details: [
      "Wait for strong momentum candle",
      "Confirm with volume analysis",
      "Enter on retest of displacement zone",
      "Target next liquidity pool",
    ],
    timeframe: "M30 - H4",
    winRate: "62-70%",
  },
];

const priceActionStrategies: Strategy[] = [
  {
    id: "pin-bar",
    name: "Pin Bar Reversal",
    description: "Trade rejection candles that signal potential reversals",
    icon: <Target className="w-5 h-5" />,
    details: [
      "Identify pin bar with long tail",
      "Confirm with support/resistance",
      "Enter at 50% retracement",
      "Stop beyond pin bar extreme",
    ],
    timeframe: "M15 - D1",
    winRate: "55-63%",
  },
  {
    id: "engulfing",
    name: "Engulfing Pattern",
    description: "Trade reversal patterns where candles fully engulf previous candle",
    icon: <Activity className="w-5 h-5" />,
    details: [
      "Wait for complete engulfing candle",
      "Confirm at key market structure level",
      "Enter on candle close",
      "Target 1:2 R:R minimum",
    ],
    timeframe: "M30 - D1",
    winRate: "52-60%",
  },
  {
    id: "inside-bar",
    name: "Inside Bar Strategy",
    description: "Trade consolidation patterns that precede breakouts",
    icon: <Layers className="w-5 h-5" />,
    details: [
      "Identify mother candle + inside bar",
      "Wait for breakout direction",
      "Confirm with trend alignment",
      "Use trailing stop strategy",
    ],
    timeframe: "H1 - D1",
    winRate: "50-58%",
  },
  {
    id: "double-top-bottom",
    name: "Double Top/Bottom",
    description: "Trade classic reversal patterns at key support/resistance",
    icon: <BarChart2 className="w-5 h-5" />,
    details: [
      "Identify double pattern formation",
      "Confirm with trend line break",
      "Enter on neckline breakout",
      "Target pattern height projection",
    ],
    timeframe: "H4 - D1",
    winRate: "55-65%",
  },
];

const srStrategies: Strategy[] = [
  {
    id: "support-resistance",
    name: "S/R Zone Trading",
    description: "Trade bounces or breaks at key horizontal support and resistance zones",
    icon: <LineChart className="w-5 h-5" />,
    details: [
      "Map historical price reaction zones",
      "Wait for price to approach zone",
      "Confirm with price action signals",
      "Use zone width for stop placement",
    ],
    timeframe: "M15 - D1",
    winRate: "55-62%",
  },
  {
    id: "trendline",
    name: "Trendline Trading",
    description: "Trade trendline bounces and breaks for trend continuation",
    icon: <TrendingDown className="w-5 h-5" />,
    details: [
      "Draw trendlines from significant highs/lows",
      "Wait for price to touch trendline",
      "Confirm with price action signal",
      "Trade with trend direction preferred",
    ],
    timeframe: "M30 - D1",
    winRate: "53-60%",
  },
  {
    id: "dynamic-sr",
    name: "Dynamic S/R (EMA)",
    description: "Use moving averages as dynamic support and resistance levels",
    icon: <ArrowUpDown className="w-5 h-5" />,
    details: [
      "Use 20, 50, 200 EMA combinations",
      "Wait for price to test EMA",
      "Confirm with candle rejection",
      "Use EMA angle for trend strength",
    ],
    timeframe: "M15 - H4",
    winRate: "50-58%",
  },
  {
    id: "pivot-points",
    name: "Pivot Point Strategy",
    description: "Trade from daily pivot levels with precise entry points",
    icon: <Crosshair className="w-5 h-5" />,
    details: [
      "Calculate daily pivot levels",
      "Wait for price to approach pivots",
      "Use pivot touches for entries",
      "Target next pivot level",
    ],
    timeframe: "M15 - H1",
    winRate: "52-60%",
  },
];

const marketStructureStrategies: Strategy[] = [
  {
    id: "structure-break",
    name: "Structure Break (CHoCH)",
    description: "Trade breaks of market structure that signal trend changes",
    icon: <CircleDot className="w-5 h-5" />,
    details: [
      "Identify recent swing high/low",
      "Wait for break below/above structure",
      "Confirm with close beyond level",
      "Target next structure target",
    ],
    timeframe: "M15 - H4",
    winRate: "58-65%",
  },
  {
    id: "breakout-retest",
    name: "Breakout & Retest",
    description: "Enter trades on retests of broken structure levels",
    icon: <Zap className="w-5 h-5" />,
    details: [
      "Wait for clean breakout",
      "Mark the breakout level",
      "Wait for retest of level",
      "Enter on retest confirmation",
    ],
    timeframe: "M30 - H4",
    winRate: "60-68%",
  },
  {
    id: "swing-structure",
    name: "Swing Structure Trading",
    description: "Trade swing highs and lows within trending markets",
    icon: <Waves className="w-5 h-5" />,
    details: [
      "Identify clear swing points",
      "Draw swing structure lines",
      "Trade bounces off structure",
      "Use previous swing for targets",
    ],
    timeframe: "H1 - D1",
    winRate: "55-62%",
  },
  {
    id: "change-of-character",
    name: "Change of Character (CHoCH)",
    description: "Identify shifts in market behavior indicating trend reversal",
    icon: <Activity className="w-5 h-5" />,
    details: [
      "Monitor for momentum shift",
      "Compare recent vs previous structure",
      "Enter on structure break",
      "Use Fibonacci for target",
    ],
    timeframe: "M30 - D1",
    winRate: "56-63%",
  },
];

const ictStrategies: Strategy[] = [
  {
    id: "kill-zone",
    name: "Kill Zone Trading",
    description: "Trade during high-probability session kill zones",
    icon: <Clock className="w-5 h-5" />,
    details: [
      "Identify London/NY session overlap",
      "Wait for kill zone to open",
      "Trade in direction of daily bias",
      "Use 15-minute structure",
    ],
    timeframe: "M15 - H1",
    winRate: "60-70%",
  },
  {
    id: "market-cycles",
    name: "Market Cycles Strategy",
    description: "Trade based on recurring market cycle patterns",
    icon: <CircleDot className="w-5 h-5" />,
    details: [
      "Map market cycle phases",
      "Identify accumulation/distribution",
      "Trade with cycle direction",
      "Use cycle highs/lows for targets",
    ],
    timeframe: "H4 - D1",
    winRate: "55-65%",
  },
  {
    id: "optimal-trade-entry",
    name: "Optimal Trade Entry (OTE)",
    description: "Find optimal entry using Fibonacci retracement zones",
    icon: <Target className="w-5 h-5" />,
    details: [
      "Identify significant swing",
      "Apply Fibonacci retracement",
      "Look for 62-79% zone",
      "Confirm with order block/FVG",
    ],
    timeframe: "M30 - H4",
    winRate: "58-68%",
  },
  {
    id: "supply-demand",
    name: "Supply & Demand Zones",
    description: "Trade from institutional supply and demand zones",
    icon: <BarChart3 className="w-5 h-5" />,
    details: [
      "Identify strong momentum away from zone",
      "Mark base of supply/demand",
      "Wait for return to zone",
      "Enter with tight stop",
    ],
    timeframe: "M15 - D1",
    winRate: "60-70%",
  },
];

function StrategyCard({
  strategy,
  isExpanded,
  onToggle,
}: {
  strategy: Strategy;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`bg-[#141414] border border-[#1a1a1a] rounded-lg cursor-pointer transition-all duration-300 hover:border-[#C9A84C] hover:shadow-[0_0_20px_rgba(201,168,76,0.1)] overflow-hidden`}
        onClick={onToggle}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-[rgba(201,168,76,0.1)] text-[#C9A84C] flex-shrink-0">
                {strategy.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold text-sm mb-1">
                  {strategy.name}
                </h4>
                <p className="text-[#8899BB] text-xs leading-relaxed">
                  {strategy.description}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-[#445577]"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 text-[9px] font-medium tracking-wide rounded bg-[rgba(201,168,76,0.1)] text-[#C9A84C]">
                  {strategy.timeframe}
                </span>
                <span className="px-2 py-0.5 text-[9px] font-medium tracking-wide rounded bg-[rgba(0,229,160,0.1)] text-[#00E5A0]">
                  {strategy.winRate}
                </span>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-[#1a1a1a]">
                  <h5 className="text-[#C9A84C] text-[10px] font-bold tracking-wider uppercase mb-3">
                    Key Components
                  </h5>
                  <ul className="space-y-2">
                    {strategy.details.map((detail, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-2 text-[#8899BB] text-xs"
                      >
                        <span className="w-1 h-1 rounded-full bg-[#C9A84C] mt-1.5 flex-shrink-0" />
                        {detail}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function StrategyLibrary() {
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  const toggleStrategy = (id: string) => {
    setExpandedStrategy(expandedStrategy === id ? null : id);
  };

  const tabs = [
    { value: "smc", label: "SMC", strategies: smcStrategies },
    { value: "price-action", label: "Price Action", strategies: priceActionStrategies },
    { value: "sr", label: "S&R", strategies: srStrategies },
    { value: "market-structure", label: "Market Structure", strategies: marketStructureStrategies },
    { value: "ict", label: "ICT Concepts", strategies: ictStrategies },
  ];

  return (
    <section id="library" className="max-w-[1400px] mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <p className="text-[#C9A84C] font-mono uppercase tracking-wider text-sm mb-2">
          // PROVEN METHODOLOGIES
        </p>
        <h2 className="text-5xl md:text-6xl font-bold text-white tracking-wide font-['Bebas_Neue']">
          STRATEGY LIBRARY
        </h2>
      </div>

      <Tabs defaultValue="smc" className="w-full">
        <TabsList className="bg-[#0A0A0A] border border-[#1a1a1a] p-1 rounded-lg mb-8 w-full justify-start overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="px-5 py-2.75 text-[11px] font-medium tracking-[1.5px] uppercase cursor-pointer border-b-2 transition-all whitespace-nowrap data-[state=active]:text-[#C9A84C] data-[state=active]:border-[#C9A84C] text-[#8899BB] border-transparent hover:text-[#EEF2FF]"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tab.strategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  isExpanded={expandedStrategy === strategy.id}
                  onToggle={() => toggleStrategy(strategy.id)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
