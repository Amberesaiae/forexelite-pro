"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

const strategyTypes = [
  { value: "trend", label: "Trend Following" },
  { value: "breakout", label: "Breakout" },
  { value: "scalping", label: "Scalping" },
  { value: "grid", label: "Grid" },
];

const generateMQL5Code = (config: {
  strategy: string;
  riskPercent: number;
  lotSize: number;
  maxSpread: number;
  stopLoss: number;
  takeProfit: number;
  trailingStop: boolean;
  newsFilter: boolean;
  martingale: boolean;
  autoLot: boolean;
}): string => {
  const strategyNames: Record<string, string> = {
    trend: "TrendMaster",
    breakout: "BreakoutPro",
    scalping: "ScalpKing",
    grid: "GridMaster",
  };

  const strategyName = strategyNames[config.strategy] || "EAMaster";

  return `//+------------------------------------------------------------------+
//|                                                    ${strategyName}.mq5 |
//|                                      Expert Advisor Generator v2.0     |
//|                                                           TradePro    |
//+------------------------------------------------------------------+
#property copyright "TradePro"
#property version   "2.00"
#property strict

//--- INPUT PARAMETERS
input group "=== STRATEGY CONFIGURATION ==="
input ENUM_TIMEFRAMES TimeFrame = PERIOD_H1;           // Timeframe
input string StrategyType = "${config.strategy}";       // Strategy: trend|breakout|scalping|grid

input group "=== RISK MANAGEMENT ==="
input double RiskPercent = ${config.riskPercent};       // Risk per Trade (%)
input double Lotsize = ${config.lotSize};              // Fixed Lot Size
input bool AutoLot = ${config.autoLot.toString()};      // Auto Lot Sizing
input double MaxSpread = ${config.maxSpread};          // Max Spread (points)

input group "=== STOP LOSS & TAKE PROFIT ==="
input int StopLoss = ${config.stopLoss};               // Stop Loss (pips)
input int TakeProfit = ${config.takeProfit};           // Take Profit (pips)
input bool TrailingStop = ${config.trailingStop.toString()}; // Enable Trailing Stop

input group "=== ADVANCED OPTIONS ==="
input bool NewsFilter = ${config.newsFilter.toString()};     // News Filter
input bool Martingale = ${config.martingale.toString()};      // Martingale Mode
input double MartingaleMultiplier = 2.0;              // Martingale Multiplier
input int MagicNumber = 2024001;                     // Magic Number

//--- GLOBAL VARIABLES
double g_LotSize = 0;
double g_TrailingStopLevel = 0;
int g_TotalOrders = 0;
datetime g_LastTradeTime = 0;
double g_BaseLot = 0;
int g_MartingaleStep = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                    |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("EA Initialized: ", StrategyType);
   
   if(AutoLot && RiskPercent > 0)
   {
      g_BaseLot = CalculateLotSize(RiskPercent);
      Print("Auto Lot Size: ", DoubleToString(g_BaseLot, 2));
   }
   else
   {
      g_BaseLot = Lotsize;
   }
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("EA Deinitialized: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!IsTradeAllowed())
      return;
   
   if(NewsFilter && IsNewsTime())
      return;
   
   g_TotalOrders = CountOpenOrders();
   
   if(g_TotalOrders == 0)
   {
      if(ShouldOpenTrade())
      {
         OpenTrade();
      }
   }
   else
   {
      if(TrailingStop)
         ApplyTrailingStop();
      
      if(Martingale && IsLastTradeLoss())
         ApplyMartingale();
   }
   
   g_LastTradeTime = TimeCurrent();
}

//+------------------------------------------------------------------+
//| Calculate Lot Size based on Risk                                 |
//+------------------------------------------------------------------+
double CalculateLotSize(double risk)
{
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double lotStep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   
   double riskAmount = balance * (risk / 100.0);
   double lotSize = riskAmount / (StopLoss * tickValue * 10);
   
   lotSize = MathFloor(lotSize / lotStep) * lotStep;
   lotSize = MathMin(lotSize, maxLot);
   
   return NormalizeDouble(lotSize, 2);
}

//+------------------------------------------------------------------+
//| Check if should open new trade                                    |
//+------------------------------------------------------------------+
bool ShouldOpenTrade()
{
   double spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   if(spread > MaxSpread)
      return false;
   
   ENUM_TIMEFRAMES tf = StringToTimeFrame(EnumToString(TimeFrame));
   
   double ema20 = iMA(_Symbol, tf, 20, 0, MODE_EMA, PRICE_CLOSE);
   double ema50 = iMA(_Symbol, tf, 50, 0, MODE_EMA, PRICE_CLOSE);
   double rsi = iRSI(_Symbol, tf, 14, PRICE_CLOSE);
   
   bool buySignal = false;
   bool sellSignal = false;
   
   if(StrategyType == "trend")
   {
      buySignal = (ema20 > ema50) && (rsi < 70) && (rsi > 30);
      sellSignal = (ema20 < ema50) && (rsi > 30) && (rsi < 70);
   }
   else if(StrategyType == "breakout")
   {
      double high = iHigh(_Symbol, tf, 1);
      double low = iLow(_Symbol, tf, 1);
      double close = iClose(_Symbol, tf, 1);
      
      buySignal = (close > high) && (rsi < 80);
      sellSignal = (close < low) && (rsi > 20);
   }
   else if(StrategyType == "scalping")
   {
      double ema9 = iMA(_Symbol, tf, 9, 0, MODE_EMA, PRICE_CLOSE);
      double currentClose = iClose(_Symbol, tf, 0);
      
      buySignal = (currentClose > ema9) && (rsi < 65) && (spread < 15);
      sellSignal = (currentClose < ema9) && (rsi > 35) && (spread < 15);
   }
   else if(StrategyType == "grid")
   {
      buySignal = (g_TotalOrders < 5);
      sellSignal = false;
   }
   
   return buySignal || sellSignal;
}

//+------------------------------------------------------------------+
//| Open new trade                                                    |
//+------------------------------------------------------------------+
void OpenTrade()
{
   double lotSize = (Martingale) ? g_BaseLot * MathPow(MartingaleMultiplier, g_MartingaleStep) : g_BaseLot;
   lotSize = NormalizeDouble(lotSize, 2);
   
   ENUM_ORDER_TYPE orderType = ORDER_TYPE_BUY;
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   
   if(ShouldOpenTrade())
   {
      // Determine direction based on strategy
      orderType = ORDER_TYPE_BUY;
   }
   else
   {
      orderType = ORDER_TYPE_SELL;
   }
   
   double sl = 0, tp = 0;
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   if(orderType == ORDER_TYPE_BUY)
   {
      sl = ask - StopLoss * point * 10;
      tp = ask + TakeProfit * point * 10;
   }
   else
   {
      sl = bid + StopLoss * point * 10;
      tp = bid - TakeProfit * point * 10;
   }
   
   sl = NormalizeDouble(sl, _Digits);
   tp = NormalizeDouble(tp, _Digits);
   
   MqlTradeRequest request = {};
   MqlTradeResult result = {};
   
   request.action = TRADE_ACTION_DEAL;
   request.symbol = _Symbol;
   request.volume = lotSize;
   request.type = orderType;
   request.price = (orderType == ORDER_TYPE_BUY) ? ask : bid;
   request.sl = sl;
   request.tp = tp;
   request.magic = MagicNumber;
   request.comment = "EA_" + StrategyType;
   request.type_filling = ORDER_FILLING_FOK;
   
   if(!OrderSend(request, result))
   {
      Print("OrderSend failed: ", result.retcode);
   }
   else
   {
      Print("Order opened: ", orderType, " Lot: ", lotSize);
   }
}

//+------------------------------------------------------------------+
//| Apply Trailing Stop                                              |
//+------------------------------------------------------------------+
void ApplyTrailingStop()
{
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   int trailingDistance = StopLoss / 2;
   
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS))
      {
         if(OrderMagicNumber() == MagicNumber && OrderSymbol() == _Symbol)
         {
            double sl = OrderStopLoss();
            double tp = OrderTakeProfit();
            double price = OrderOpenPrice();
            
            if(OrderType() == ORDER_TYPE_BUY)
            {
               double newSL = Bid - trailingDistance * point * 10;
               if(newSL > sl && sl > 0)
               {
                  OrderModify(OrderTicket(), price, newSL, tp, 0);
               }
            }
            else if(OrderType() == ORDER_TYPE_SELL)
            {
               double newSL = Ask + trailingDistance * point * 10;
               if(newSL < sl || sl == 0)
               {
                  OrderModify(OrderTicket(), price, newSL, tp, 0);
               }
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Apply Martingale                                                  |
//+------------------------------------------------------------------+
void ApplyMartingale()
{
   if(IsLastTradeLoss())
   {
      g_MartingaleStep++;
      Print("Martingale step: ", g_MartingaleStep);
   }
   else
   {
      g_MartingaleStep = 0;
   }
}

//+------------------------------------------------------------------+
//| Check if last trade was loss                                     |
//+------------------------------------------------------------------+
bool IsLastTradeLoss()
{
   HistorySelect(0, TimeCurrent());
   int deals = HistoryDealsTotal();
   
   for(int i = deals - 1; i >= 0; i--)
   {
      if(HistoryDealSelect(i))
      {
         if(HistoryDealGetInteger(i, DEAL_MAGIC) == MagicNumber)
         {
            return HistoryDealGetInteger(i, DEAL_PROFIT) < 0;
         }
      }
   }
   return false;
}

//+------------------------------------------------------------------+
//| Count open orders                                                |
//+------------------------------------------------------------------+
int CountOpenOrders()
{
   int count = 0;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS))
      {
         if(OrderMagicNumber() == MagicNumber && OrderSymbol() == _Symbol)
         {
            count++;
         }
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| Check news filter                                                |
//+------------------------------------------------------------------+
bool IsNewsTime()
{
   MqlCalendarEvent events[];
   TimeToStruct(TimeCurrent(), "");
   
   // Simplified news check - in production, integrate with news API
   return false;
}

//+------------------------------------------------------------------+
`;
};

export function EAGenerator() {
  const [strategy, setStrategy] = useState("trend");
  const [riskPercent, setRiskPercent] = useState("2");
  const [lotSize, setLotSize] = useState("0.1");
  const [maxSpread, setMaxSpread] = useState("30");
  const [stopLoss, setStopLoss] = useState("50");
  const [takeProfit, setTakeProfit] = useState("100");
  const [trailingStop, setTrailingStop] = useState(false);
  const [newsFilter, setNewsFilter] = useState(false);
  const [martingale, setMartingale] = useState(false);
  const [autoLot, setAutoLot] = useState(true);

  const generatedCode = useMemo(() => {
    return generateMQL5Code({
      strategy,
      riskPercent: parseFloat(riskPercent) || 2,
      lotSize: parseFloat(lotSize) || 0.1,
      maxSpread: parseFloat(maxSpread) || 30,
      stopLoss: parseInt(stopLoss) || 50,
      takeProfit: parseInt(takeProfit) || 100,
      trailingStop,
      newsFilter,
      martingale,
      autoLot,
    });
  }, [strategy, riskPercent, lotSize, maxSpread, stopLoss, takeProfit, trailingStop, newsFilter, martingale, autoLot]);

  return (
    <section id="ea-generator" className="bg-[#0A0A0A] border-t border-b border-[#1a1a1a] py-16">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="mb-10">
          <div className="text-[10px] tracking-[3px] uppercase text-[#C9A84C] font-mono mb-2.5">
            {/* MQL5 CODE GENERATOR */}
          </div>
          <h2 className="text-[clamp(32px,6vw,64px)] font-['Bebas_Neue'] leading-none tracking-[1px] mb-3.5 text-white">
            EA GENERATOR
          </h2>
          <p className="text-[14px] text-[#666] max-w-[560px] leading-[1.7] font-light">
            Configure your strategy parameters and generate production-ready MQL5 Expert Advisor code instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-0 border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#0A0A0A]">
          {/* Controls Panel */}
          <div className="p-6 border-b xl:border-b-0 xl:border-r border-[#1a1a1a] flex flex-col gap-5 bg-[#0A0A0A] overflow-y-auto max-h-[700px]">
            <h3 className="font-['Bebas_Neue'] text-base tracking-[2px] text-[#C9A84C]">
              EA PARAMETERS
            </h3>

            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] tracking-[2px] uppercase text-[#444] font-mono">Strategy Type</div>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger className="bg-[#141414] border-[#1a1a1a] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-[#1a1a1a]">
                  {strategyTypes.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] tracking-[2px] uppercase text-[#444] font-mono">Risk %</div>
              <Input
                type="number"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                min={0.1}
                max={10}
                step={0.1}
                className="bg-[#141414] border-[#1a1a1a] text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] tracking-[2px] uppercase text-[#444] font-mono">Lot Size</div>
              <Input
                type="number"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                min={0.01}
                max={100}
                step={0.01}
                className="bg-[#141414] border-[#1a1a1a] text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] tracking-[2px] uppercase text-[#444] font-mono">Max Spread (points)</div>
              <Input
                type="number"
                value={maxSpread}
                onChange={(e) => setMaxSpread(e.target.value)}
                min={1}
                max={100}
                step={1}
                className="bg-[#141414] border-[#1a1a1a] text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] tracking-[2px] uppercase text-[#444] font-mono">Stop Loss (pips)</div>
              <Input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                min={5}
                max={500}
                step={5}
                className="bg-[#141414] border-[#1a1a1a] text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] tracking-[2px] uppercase text-[#444] font-mono">Take Profit (pips)</div>
              <Input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                min={5}
                max={1000}
                step={5}
                className="bg-[#141414] border-[#1a1a1a] text-white"
              />
            </div>

            <div className="border-t border-[#1a1a1a] pt-5">
              <div className="text-[9px] tracking-[2px] uppercase text-[#444] font-mono mb-4">Advanced Features</div>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#888] font-mono">Trailing Stop</span>
                  <Toggle pressed={trailingStop} onPressedChange={setTrailingStop} className="data-[state=on]:bg-[#C9A84C] data-[state=on]:text-black" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#888] font-mono">News Filter</span>
                  <Toggle pressed={newsFilter} onPressedChange={setNewsFilter} className="data-[state=on]:bg-[#C9A84C] data-[state=on]:text-black" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#888] font-mono">Martingale</span>
                  <Toggle pressed={martingale} onPressedChange={setMartingale} className="data-[state=on]:bg-[#C9A84C] data-[state=on]:text-black" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#888] font-mono">Auto Lot</span>
                  <Toggle pressed={autoLot} onPressedChange={setAutoLot} className="data-[state=on]:bg-[#C9A84C] data-[state=on]:text-black" />
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                navigator.clipboard.writeText(generatedCode);
              }}
              className="bg-[#C9A84C] text-black hover:bg-[#E8C97A] mt-2 w-full font-medium"
            >
              Copy MQL5 Code
            </Button>
          </div>

          {/* Code Preview Panel */}
          <div className="p-5 flex flex-col gap-3.5 bg-[#0A0A0A] overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="font-['Bebas_Neue'] text-base tracking-[2px] text-[#C9A84C]">
                CODE PREVIEW
              </h3>
              <span className="text-[9px] tracking-[2px] uppercase text-[#444] font-mono">
                MQL5
              </span>
            </div>

            <div className="flex-1 overflow-auto rounded-md bg-[#141414] border border-[#1a1a1a]">
              <pre className="text-[11px] leading-[1.6] p-4 font-mono text-[#a0a0a0] overflow-x-auto">
                <code>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={generatedCode}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      dangerouslySetInnerHTML={{
                        __html: generatedCode
                          .replace(/(\/\/.*$)/gm, '<span class="text-[#6A9955]">$1</span>')
                          .replace(/(#property.*$)/gm, '<span class="text-[#C586C0]">$1</span>')
                          .replace(/\b(input|void|int|double|string|bool|datetime|ENUM_|ORDER_|TRADE_)\b/g, '<span class="text-[#4EC9B0]">$1</span>')
                          .replace(/\b(OnInit|OnTick|OnDeinit|CalculateLotSize|ShouldOpenTrade|OpenTrade|ApplyTrailingStop|ApplyMartingale|IsLastTradeLoss|CountOpenOrders|IsNewsTime)\b/g, '<span class="text-[#DCDCAA]">$1</span>')
                          .replace(/(true|false|NULL|INIT_SUCCEEDED)/g, '<span class="text-[#569CD6]">$1</span>')
                          .replace(/(".*?")/g, '<span class="text-[#CE9178]">$1</span>')
                          .replace(/(\d+\.?\d*)/g, '<span class="text-[#B5CEA8]">$1</span>'),
                      }}
                    />
                  </AnimatePresence>
                </code>
              </pre>
            </div>

            <div className="flex items-center gap-4 text-[10px] text-[#444] font-mono">
              <span>Lines: {generatedCode.split('\n').length}</span>
              <span className="text-[#C9A84C]">●</span>
              <span>Ready to compile</span>
              <span className="text-[#C9A84C]">●</span>
              <span>MT5 Compatible</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EAGenerator;
