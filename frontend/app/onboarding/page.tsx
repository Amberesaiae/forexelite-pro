"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const steps = [
  { id: 1, name: "Connect MT5", status: "active" },
  { id: 2, name: "Risk Config", status: "pending" },
  { id: 3, name: "Disclaimer", status: "pending" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [accountType, setAccountType] = useState<"demo" | "live">("live");

  const [riskConfig, setRiskConfig] = useState({
    riskPercent: "1.0",
    maxSpread: "30",
    maxDrawdown: "20",
    dailyLossLimit: "5",
  });

  const progress = (currentStep / 3) * 100;

  const handleContinue = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push("/dashboard");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#080E1A]">
      {/* Topbar */}
      <div className="bg-[#090F1E] border-b border-[#141E30] px-8 py-3.5 flex justify-between items-center">
        <h1 className="text-[16px] font-black tracking-[2px] text-[#C9A84C]">
          FOREXELITE <span className="bg-[#C9A84C] text-[#080E1A] text-[10px] px-1 py-0.5 rounded ml-1 align-middle">PRO</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-[12px] text-[#8899BB]">Step {currentStep} of 3</span>
          <Link href="/login" className="text-[12px] text-[#C9A84C] hover:underline">
            Login
          </Link>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-[600px] mx-auto mt-12 px-6">
        <div className="flex items-center gap-0 mb-10">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                    currentStep > step.id
                      ? "bg-[#C9A84C] text-[#080E1A]"
                      : currentStep === step.id
                      ? "bg-[#C9A84C] text-[#080E1A]"
                      : "bg-[#131E32] text-[#8899BB] border border-[#131E32]"
                  }`}
                >
                  {currentStep > step.id ? "✓" : step.id}
                </div>
                <span className="text-[11px] text-[#8899BB] mt-1.5">{step.name}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 -mt-4 ${
                    currentStep > step.id ? "bg-[#C9A84C]" : "bg-[#131E32]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-[#090F1E] border border-[#141E30] rounded-[10px] p-9">
          {currentStep === 1 && (
            <>
              <h2 className="text-[20px] font-black tracking-[1px] mb-1.5">
                CONNECT YOUR MT5 ACCOUNT
              </h2>
              <p className="text-[13px] text-[#8899BB] mb-7">
                Link your MetaTrader 5 broker account to get started
              </p>

              <div className="space-y-4">
                <div>
                  <Label className="text-[12px] text-[#8899BB]">Broker Name</Label>
                  <Input
                    placeholder="e.g. Exness Global"
                    className="bg-[#0C1525] border-[#141E30] text-[#EEF2FF] h-10 mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-[12px] text-[#8899BB]">Account Number</Label>
                  <Input
                    placeholder="12345678"
                    className="bg-[#0C1525] border-[#141E30] text-[#EEF2FF] h-10 mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-[12px] text-[#8899BB]">Account Type</Label>
                  <div className="flex gap-3 mt-1.5">
                    <button
                      onClick={() => setAccountType("demo")}
                      className={`flex-1 py-2 px-5 rounded-[6px] text-[13px] border transition-colors ${
                        accountType === "demo"
                          ? "border-[#C9A84C] text-[#C9A84C] bg-[#0C1525]"
                          : "border-[#131E32] text-[#8899BB] bg-[#0C1525]"
                      }`}
                    >
                      Demo
                    </button>
                    <button
                      onClick={() => setAccountType("live")}
                      className={`flex-1 py-2 px-5 rounded-[6px] text-[13px] border transition-colors ${
                        accountType === "live"
                          ? "border-[#C9A84C] text-[#C9A84C] bg-[#0C1525]"
                          : "border-[#131E32] text-[#8899BB] bg-[#0C1525]"
                      }`}
                    >
                      Live
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-[12px] text-[#8899BB]">Label (optional)</Label>
                  <Input
                    placeholder="My Main Account"
                    className="bg-[#0C1525] border-[#141E32] text-[#EEF2FF] h-10 mt-1.5"
                  />
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h2 className="text-[20px] font-black tracking-[1px] mb-1.5">
                CONFIGURE RISK PARAMETERS
              </h2>
              <p className="text-[13px] text-[#8899BB] mb-7">
                Set your risk management rules for automated trading
              </p>

              <div className="space-y-4">
                <div>
                  <Label className="text-[12px] text-[#8899BB]">Risk per Trade (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={riskConfig.riskPercent}
                    onChange={(e) => setRiskConfig({ ...riskConfig, riskPercent: e.target.value })}
                    className="bg-[#0C1525] border-[#141E30] text-[#EEF2FF] h-10 mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-[12px] text-[#8899BB]">Max Spread (pips)</Label>
                  <Input
                    type="number"
                    value={riskConfig.maxSpread}
                    onChange={(e) => setRiskConfig({ ...riskConfig, maxSpread: e.target.value })}
                    className="bg-[#0C1525] border-[#141E32] text-[#EEF2FF] h-10 mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-[12px] text-[#8899BB]">Max Drawdown (%)</Label>
                  <Input
                    type="number"
                    value={riskConfig.maxDrawdown}
                    onChange={(e) => setRiskConfig({ ...riskConfig, maxDrawdown: e.target.value })}
                    className="bg-[#0C1525] border-[#141E32] text-[#EEF2FF] h-10 mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-[12px] text-[#8899BB]">Daily Loss Limit (%)</Label>
                  <Input
                    type="number"
                    value={riskConfig.dailyLossLimit}
                    onChange={(e) => setRiskConfig({ ...riskConfig, dailyLossLimit: e.target.value })}
                    className="bg-[#0C1525] border-[#141E32] text-[#EEF2FF] h-10 mt-1.5"
                  />
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h2 className="text-[20px] font-black tracking-[1px] mb-1.5">
                RISK DISCLAIMER
              </h2>
              <p className="text-[13px] text-[#8899BB] mb-7">
                Please read and acknowledge the trading risks
              </p>

              <div className="bg-[#0C1525] border border-[#141E30] rounded-[6px] p-4 h-48 overflow-y-auto text-[12px] text-[#8899BB] leading-relaxed">
                <p className="mb-4">
                  <strong className="text-[#EEF2FF]">IMPORTANT RISK WARNING</strong>
                </p>
                <p className="mb-3">
                  Trading forex and financial instruments carries a high level of risk and may not be suitable for all investors. 
                  The high degree of leverage can work against you as well as for you. Before deciding to trade, you should 
                  carefully consider your investment objectives, level of experience, and risk appetite.
                </p>
                <p className="mb-3">
                  You could lose some or all of your initial investment. Only invest money that you can afford to lose. 
                  This trading platform is for educational and informational purposes only and does not constitute financial advice.
                </p>
                <p className="mb-3">
                  Past performance is not indicative of future results. The value of investments can go down as well as up. 
                  CFDs and forex trading involve significant risk and may not be appropriate for all investors.
                </p>
                <p>
                  By using this platform, you acknowledge that you have read, understood, and agree to accept the risks 
                  associated with forex trading. You confirm that you are of legal age and have the capacity to enter into 
                  this agreement.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="accept-terms"
                  className="w-4 h-4 accent-[#C9A84C]"
                />
                <Label htmlFor="accept-terms" className="text-[12px] text-[#8899BB] cursor-pointer">
                  I have read and agree to the Risk Disclaimer and Terms of Service
                </Label>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-[#131E30] text-[#8899BB] hover:bg-[#131E30] hover:text-[#EEF2FF]"
            >
              ← Back
            </Button>
            {currentStep < 3 ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C] hover:text-[#080E1A]"
                >
                  Test Connection
                </Button>
                <Button
                  onClick={handleContinue}
                  className="bg-[#C9A84C] hover:bg-[#E8C97A] text-[#080E1A] font-bold"
                >
                  Continue →
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleContinue}
                className="bg-[#C9A84C] hover:bg-[#E8C97A] text-[#080E1A] font-bold"
              >
                Complete Setup →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
