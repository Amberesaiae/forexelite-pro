"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RiskManagement() {
  const [lotSizeResult, setLotSizeResult] = useState<string>("");
  const [pipValueResult, setPipValueResult] = useState<string>("");
  const [riskRewardResult, setRiskRewardResult] = useState<string>("");

  const [accountBalance, setAccountBalance] = useState<string>("");
  const [riskPerTrade, setRiskPerTrade] = useState<string>("");
  const [stopLossPips, setStopLossPips] = useState<string>("");
  const [lotSize, setLotSize] = useState<string>("");
  const [numberOfPips, setNumberOfPips] = useState<string>("");
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [stopLossPrice, setStopLossPrice] = useState<string>("");
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>("");
  const [currencyPair, setCurrencyPair] = useState<string>("EURUSD");

  const calculateLotSize = () => {
    const balance = parseFloat(accountBalance);
    const risk = parseFloat(riskPerTrade);
    const pips = parseFloat(stopLossPips);

    if (balance && risk && pips) {
      const riskAmount = (balance * risk) / 100;
      const pipValue = 10;
      const lotSize = (riskAmount / pips / pipValue).toFixed(2);
      setLotSizeResult(`${lotSize} lots`);
    }
  };

  const calculatePipValue = () => {
    const lots = parseFloat(lotSize);
    const pips = parseFloat(numberOfPips);

    if (lots && pips) {
      const pipValue = lots * 10 * pips;
      setPipValueResult(`$${pipValue.toFixed(2)}`);
    }
  };

  const calculateRiskReward = () => {
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLossPrice);
    const tp = parseFloat(takeProfitPrice);

    if (entry && sl && tp) {
      const risk = Math.abs(entry - sl);
      const reward = Math.abs(tp - entry);
      const ratio = (reward / risk).toFixed(2);
      setRiskRewardResult(`1:${ratio}`);
    }
  };

  const drawdownRules = [
    { label: "Daily Loss Limit", value: "Max 3%", color: "text-[#FF4560]" },
    { label: "Weekly Drawdown", value: "Max 6%", color: "text-[#FF4560]" },
    { label: "Max Risk Per Trade", value: "1–2%", color: "text-[#C9A84C]" },
    { label: "Max Open Trades", value: "3–5", color: "text-[#C9A84C]" },
    { label: "Minimum R:R", value: "1:2", color: "text-[#00E5A0]" },
    { label: "Target Win Rate", value: "45%+", color: "text-[#00E5A0]" },
    { label: "Correlation Limit", value: "3 max", color: "text-blue-400" },
  ];

  return (
    <section id="risk" className="max-w-[1400px] mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <p className="text-[#C9A84C] font-mono uppercase tracking-wider text-sm mb-2">
          {/* CAPITAL PROTECTION */}
        </p>
        <h2 className="text-5xl md:text-6xl font-bold text-white tracking-wide font-['Bebas_Neue']">
          RISK MANAGEMENT
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4.5">
        <Card className="bg-[#080E1A] border border-[#141E30] rounded-lg p-6">
          <CardContent className="p-0">
            <h3 className="text-white text-lg font-semibold mb-4 border-b border-[#141E30] pb-2">
              LOT SIZE CALCULATOR
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Account Balance ($)
                </label>
                <Input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value)}
                  placeholder="10000"
                  className="bg-[#0A1628] border-[#141E30] text-white placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Risk Per Trade (%)
                </label>
                <Input
                  type="number"
                  value={riskPerTrade}
                  onChange={(e) => setRiskPerTrade(e.target.value)}
                  placeholder="2"
                  className="bg-[#0A1628] border-[#141E30] text-white placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Stop Loss (Pips)
                </label>
                <Input
                  type="number"
                  value={stopLossPips}
                  onChange={(e) => setStopLossPips(e.target.value)}
                  placeholder="50"
                  className="bg-[#0A1628] border-[#141E30] text-white placeholder:text-gray-600"
                />
              </div>
              <Button
                onClick={calculateLotSize}
                className="w-full bg-[#C9A84C] hover:bg-[#B8963D] text-black font-semibold"
              >
                Calculate
              </Button>
              {lotSizeResult && (
                <div className="mt-3 p-3 bg-[#0A1628] rounded-lg border border-[#141E30]">
                  <p className="text-gray-400 text-sm">Position Size:</p>
                  <p className="text-[#00E5A0] text-xl font-bold">
                    {lotSizeResult}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#080E1A] border border-[#141E30] rounded-lg p-6">
          <CardContent className="p-0">
            <h3 className="text-white text-lg font-semibold mb-4 border-b border-[#141E30] pb-2">
              PIP VALUE CALCULATOR
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Currency Pair
                </label>
                <Select
                  value={currencyPair}
                  onValueChange={setCurrencyPair}
                >
                  <SelectTrigger className="bg-[#0A1628] border-[#141E30] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A1628] border-[#141E30]">
                    <SelectItem value="EURUSD" className="text-white">
                      EUR/USD
                    </SelectItem>
                    <SelectItem value="GBPUSD" className="text-white">
                      GBP/USD
                    </SelectItem>
                    <SelectItem value="USDJPY" className="text-white">
                      USD/JPY
                    </SelectItem>
                    <SelectItem value="AUDUSD" className="text-white">
                      AUD/USD
                    </SelectItem>
                    <SelectItem value="USDCAD" className="text-white">
                      USD/CAD
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Lot Size
                </label>
                <Input
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  placeholder="1.0"
                  className="bg-[#0A1628] border-[#141E30] text-white placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Number of Pips
                </label>
                <Input
                  type="number"
                  value={numberOfPips}
                  onChange={(e) => setNumberOfPips(e.target.value)}
                  placeholder="20"
                  className="bg-[#0A1628] border-[#141E30] text-white placeholder:text-gray-600"
                />
              </div>
              <Button
                onClick={calculatePipValue}
                className="w-full bg-[#C9A84C] hover:bg-[#B8963D] text-black font-semibold"
              >
                Calculate
              </Button>
              {pipValueResult && (
                <div className="mt-3 p-3 bg-[#0A1628] rounded-lg border border-[#141E30]">
                  <p className="text-gray-400 text-sm">Pip Value:</p>
                  <p className="text-[#00E5A0] text-xl font-bold">
                    {pipValueResult}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#080E1A] border border-[#141E30] rounded-lg p-6">
          <CardContent className="p-0">
            <h3 className="text-white text-lg font-semibold mb-4 border-b border-[#141E30] pb-2">
              RISK:REWARD RATIO
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Entry Price
                </label>
                <Input
                  type="number"
                  step="0.00001"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="1.1000"
                  className="bg-[#0A1628] border-[#141E30] text-white placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Stop Loss Price
                </label>
                <Input
                  type="number"
                  step="0.00001"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  placeholder="1.0950"
                  className="bg-[#0A1628] border-[#141E30] text-white placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">
                  Take Profit Price
                </label>
                <Input
                  type="number"
                  step="0.00001"
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  placeholder="1.1150"
                  className="bg-[#0A1628] border-[#141E30] text-white placeholder:text-gray-600"
                />
              </div>
              <Button
                onClick={calculateRiskReward}
                className="w-full bg-[#C9A84C] hover:bg-[#B8963D] text-black font-semibold"
              >
                Calculate
              </Button>
              {riskRewardResult && (
                <div className="mt-3 p-3 bg-[#0A1628] rounded-lg border border-[#141E30]">
                  <p className="text-gray-400 text-sm">Risk:Reward:</p>
                  <p className="text-[#00E5A0] text-xl font-bold">
                    {riskRewardResult}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#080E1A] border border-[#141E30] rounded-lg p-6">
          <CardContent className="p-0">
            <h3 className="text-white text-lg font-semibold mb-4 border-b border-[#141E30] pb-2">
              DRAWDOWN RULES
            </h3>
            <div className="space-y-3">
              {drawdownRules.map((rule, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b border-[#141E30] last:border-0"
                >
                  <span className="text-gray-400 text-sm">{rule.label}</span>
                  <span className={`font-bold ${rule.color}`}>{rule.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
