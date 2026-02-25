"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPut, apiPost } from "@/lib/api";
import { Loader2, Copy, Check, CheckCircle2 } from "lucide-react";

const steps = [
  { id: 1, name: "Connect MT5", status: "active" },
  { id: 2, name: "Risk Config", status: "pending" },
  { id: 3, name: "Disclaimer", status: "pending" },
];

const mt5Schema = z.object({
  brokerName: z.string().min(1, "Broker name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  accountType: z.enum(["Demo", "Live"]),
  label: z.string().optional(),
});

const riskConfigSchema = z.object({
  riskPerTrade: z.number().min(0.1, "Min 0.1%").max(100, "Max 100%"),
  maxSpread: z.number().min(1, "Min 1 pip").max(1000, "Max 1000 pips"),
  maxDrawdown: z.number().min(1, "Min 1%").max(100, "Max 100%"),
  dailyLossLimit: z.number().min(0.1, "Min 0.1%").max(100, "Max 100%"),
});

type MT5FormData = z.infer<typeof mt5Schema>;
type RiskConfigFormData = z.infer<typeof riskConfigSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [accountType, setAccountType] = useState<"Demo" | "Live">("Live");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [pairingKey, setPairingKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);

  const [riskConfig, setRiskConfig] = useState({
    riskPerTrade: 1.0,
    maxSpread: 30,
    maxDrawdown: 20,
    dailyLossLimit: 5,
  });

  const mt5Form = useForm<MT5FormData>({
    resolver: zodResolver(mt5Schema),
    defaultValues: {
      brokerName: "",
      accountNumber: "",
      accountType: "Live",
      label: "",
    },
  });

  const riskForm = useForm<RiskConfigFormData>({
    resolver: zodResolver(riskConfigSchema),
    defaultValues: {
      riskPerTrade: 1.0,
      maxSpread: 30,
      maxDrawdown: 20,
      dailyLossLimit: 5,
    },
  });

  const saveBrokerMutation = useMutation({
    mutationFn: async (data: MT5FormData) => {
      const response = await apiPut("/api/v1/onboarding/brokers", data);
      return response;
    },
    onSuccess: () => {
      setCurrentStep(2);
    },
    onError: (error) => {
      console.error("Failed to save broker:", error);
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (data: RiskConfigFormData & { disclaimer_accepted?: boolean }) => {
      const response = await apiPut("/api/v1/onboarding/preferences", data);
      return response;
    },
    onSuccess: () => {
      if (disclaimerAccepted) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#C9A84C", "#E8C97A", "#00E5A0", "#FFFFFF"],
        });
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setCurrentStep(3);
      }
    },
    onError: (error) => {
      console.error("Failed to save preferences:", error);
    },
  });

  const generatePairingKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiPost<{ pairing_key: string }>("/api/v1/agents/pair", {});
      return response;
    },
    onSuccess: (data) => {
      if (data?.data?.pairing_key) {
        setPairingKey(data.data.pairing_key);
      }
    },
    onError: (error) => {
      console.error("Failed to generate pairing key:", error);
    },
  });

  const handleMT5Submit = (data: MT5FormData) => {
    saveBrokerMutation.mutate({
      ...data,
      accountType,
    });
  };

  const handleRiskSubmit = (data: RiskConfigFormData) => {
    setRiskConfig(data);
    savePreferencesMutation.mutate(data);
  };

  const handleCompleteSetup = () => {
    if (disclaimerAccepted) {
      savePreferencesMutation.mutate({
        ...riskConfig,
        disclaimer_accepted: true,
      });
    }
  };

  const handleCopyPairingKey = () => {
    if (pairingKey) {
      navigator.clipboard.writeText(pairingKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGeneratePairingKey = () => {
    generatePairingKeyMutation.mutate();
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
      <div className="max-w-[800px] mx-auto mt-12 px-6">
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

              <form onSubmit={mt5Form.handleSubmit(handleMT5Submit)}>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[12px] text-[#8899BB]">Broker Name</Label>
                    <Input
                      placeholder="e.g. Exness Global"
                      {...mt5Form.register("brokerName")}
                      className="bg-[#0C1525] border-[#141E30] text-[#EEF2FF] h-10 mt-1.5"
                    />
                    {mt5Form.formState.errors.brokerName && (
                      <p className="text-[#FF6B6B] text-[11px] mt-1">
                        {mt5Form.formState.errors.brokerName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-[12px] text-[#8899BB]">Account Number</Label>
                    <Input
                      placeholder="12345678"
                      {...mt5Form.register("accountNumber")}
                      className="bg-[#0C1525] border-[#141E30] text-[#EEF2FF] h-10 mt-1.5"
                    />
                    {mt5Form.formState.errors.accountNumber && (
                      <p className="text-[#FF6B6B] text-[11px] mt-1">
                        {mt5Form.formState.errors.accountNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-[12px] text-[#8899BB]">Account Type</Label>
                    <div className="flex gap-3 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setAccountType("Demo")}
                        className={`flex-1 py-2 px-5 rounded-[6px] text-[13px] border transition-colors ${
                          accountType === "Demo"
                            ? "border-[#C9A84C] text-[#C9A84C] bg-[#0C1525]"
                            : "border-[#131E32] text-[#8899BB] bg-[#0C1525]"
                        }`}
                      >
                        Demo
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType("Live")}
                        className={`flex-1 py-2 px-5 rounded-[6px] text-[13px] border transition-colors ${
                          accountType === "Live"
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
                      {...mt5Form.register("label")}
                      className="bg-[#0C1525] border-[#141E32] text-[#EEF2FF] h-10 mt-1.5"
                    />
                  </div>
                </div>

                {/* Agent Pairing Panel */}
                <div className="mt-8 pt-6 border-t border-[#141E30]">
                  <h3 className="text-[16px] font-bold text-[#EEF2FF] mb-4">Agent Pairing</h3>
                  
                  {!pairingKey ? (
                    <div className="text-center py-4">
                      <p className="text-[13px] text-[#8899BB] mb-4">
                        Generate a pairing key to connect your trading agent
                      </p>
                      <Button
                        type="button"
                        onClick={handleGeneratePairingKey}
                        disabled={generatePairingKeyMutation.isPending}
                        className="bg-[#131E32] hover:bg-[#1A2740] text-[#EEF2FF] border border-[#C9A84C]"
                      >
                        {generatePairingKeyMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          "Generate Pairing Key"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-[#0C1525] border border-[#141E30] rounded-[6px] p-4">
                        <Label className="text-[11px] text-[#8899BB] block mb-2">PAIRING KEY</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-[#080E1A] text-[#C9A84C] font-mono text-[14px] px-3 py-2 rounded">
                            {pairingKey}
                          </code>
                          <Button
                            type="button"
                            onClick={handleCopyPairingKey}
                            variant="outline"
                            size="sm"
                            className="border-[#141E30] text-[#8899BB]"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="bg-[#1A2740] border border-[#C9A84C]/30 rounded-[6px] p-4">
                        <p className="text-[12px] text-[#C9A84C] mb-2">
                          <strong>Setup Instructions:</strong>
                        </p>
                        <ol className="text-[11px] text-[#8899BB] space-y-1 list-decimal list-inside">
                          <li>Enter this pairing key in your EA settings</li>
                          <li>Restart your MetaTrader 5 terminal</li>
                          <li>The agent will automatically connect</li>
                        </ol>
                      </div>

                      <Button
                        type="button"
                        onClick={() => setConnectionTested(true)}
                        variant="outline"
                        className={`w-full border ${
                          connectionTested
                            ? "border-[#00E5A0] text-[#00E5A0]"
                            : "border-[#C9A84C] text-[#C9A84C]"
                        }`}
                      >
                        {connectionTested ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Connection Tested
                          </>
                        ) : (
                          "Test Connection"
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/login")}
                    className="border-[#131E30] text-[#8899BB] hover:bg-[#131E30] hover:text-[#EEF2FF]"
                  >
                    ← Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveBrokerMutation.isPending}
                    className="bg-[#C9A84C] hover:bg-[#E8C97A] text-[#080E1A] font-bold"
                  >
                    {saveBrokerMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Continue →"
                    )}
                  </Button>
                </div>
              </form>
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

              <form onSubmit={riskForm.handleSubmit(handleRiskSubmit)}>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[12px] text-[#8899BB]">Risk per Trade (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      {...riskForm.register("riskPerTrade", { valueAsNumber: true })}
                      className="bg-[#0C1525] border-[#141E30] text-[#EEF2FF] h-10 mt-1.5"
                    />
                    {riskForm.formState.errors.riskPerTrade && (
                      <p className="text-[#FF6B6B] text-[11px] mt-1">
                        {riskForm.formState.errors.riskPerTrade.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-[12px] text-[#8899BB]">Max Spread (pips)</Label>
                    <Input
                      type="number"
                      {...riskForm.register("maxSpread", { valueAsNumber: true })}
                      className="bg-[#0C1525] border-[#141E32] text-[#EEF2FF] h-10 mt-1.5"
                    />
                    {riskForm.formState.errors.maxSpread && (
                      <p className="text-[#FF6B6B] text-[11px] mt-1">
                        {riskForm.formState.errors.maxSpread.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-[12px] text-[#8899BB]">Max Drawdown (%)</Label>
                    <Input
                      type="number"
                      {...riskForm.register("maxDrawdown", { valueAsNumber: true })}
                      className="bg-[#0C1525] border-[#141E32] text-[#EEF2FF] h-10 mt-1.5"
                    />
                    {riskForm.formState.errors.maxDrawdown && (
                      <p className="text-[#FF6B6B] text-[11px] mt-1">
                        {riskForm.formState.errors.maxDrawdown.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-[12px] text-[#8899BB]">Daily Loss Limit (%)</Label>
                    <Input
                      type="number"
                      {...riskForm.register("dailyLossLimit", { valueAsNumber: true })}
                      className="bg-[#0C1525] border-[#141E32] text-[#EEF2FF] h-10 mt-1.5"
                    />
                    {riskForm.formState.errors.dailyLossLimit && (
                      <p className="text-[#FF6B6B] text-[11px] mt-1">
                        {riskForm.formState.errors.dailyLossLimit.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="border-[#131E30] text-[#8899BB] hover:bg-[#131E30] hover:text-[#EEF2FF]"
                  >
                    ← Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={savePreferencesMutation.isPending}
                    className="bg-[#C9A84C] hover:bg-[#E8C97A] text-[#080E1A] font-bold"
                  >
                    {savePreferencesMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Continue →"
                    )}
                  </Button>
                </div>
              </form>
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
                  checked={disclaimerAccepted}
                  onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                  className="w-4 h-4 accent-[#C9A84C]"
                />
                <Label htmlFor="accept-terms" className="text-[12px] text-[#8899BB] cursor-pointer">
                  I have read and agree to the Risk Disclaimer and Terms of Service
                </Label>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="border-[#131E30] text-[#8899BB] hover:bg-[#131E30] hover:text-[#EEF2FF]"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleCompleteSetup}
                  disabled={!disclaimerAccepted || savePreferencesMutation.isPending}
                  className="bg-[#C9A84C] hover:bg-[#E8C97A] text-[#080E1A] font-bold disabled:opacity-50"
                >
                  {savePreferencesMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    "Complete Setup →"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
