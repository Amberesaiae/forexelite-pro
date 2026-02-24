"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const tickerPairs = [
  { pair: "EURUSD", price: "1.08428", change: "+0.42%", up: true },
  { pair: "GBPUSD", price: "1.26910", change: "+0.31%", up: true },
  { pair: "XAUUSD", price: "2034.50", change: "+0.55%", up: true },
  { pair: "USDJPY", price: "149.82", change: "0.00%", up: false },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-[#080E1A] flex flex-col items-center justify-center relative">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-[22px] font-black tracking-[2px] text-[#C9A84C]">
          FOREXELITE <span className="bg-[#C9A84C] text-[#080E1A] text-[11px] px-1.5 py-0.5 rounded ml-1.5 align-middle">PRO</span>
        </h1>
      </div>

      {/* Login Card */}
      <div className="bg-[#090F1E] border border-[#141E30] rounded-[10px] p-9 w-[380px]">
        <h2 className="text-[26px] font-black tracking-[1px] mb-1">WELCOME BACK</h2>
        <p className="text-[13px] text-[#8899BB] mb-7">Sign in to your trading desk</p>

        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-[#8899BB] block mb-1.5">Email</label>
            <Input
              type="email"
              placeholder="trader@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#0C1525] border-[#141E30] text-[#EEF2FF] text-[14px] rounded-[6px] h-10"
            />
          </div>

          <div>
            <label className="text-[12px] text-[#8899BB] block mb-1.5">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#0C1525] border-[#141E30] text-[#EEF2FF] text-[14px] rounded-[6px] h-10"
            />
          </div>

          <Button
            className="w-full mt-6 bg-[#C9A84C] hover:bg-[#E8C97A] text-[#080E1A] font-bold text-[14px] h-11 rounded-[6px] tracking-wide"
          >
            SIGN IN
          </Button>

          <p className="text-[13px] text-center text-[#8899BB] mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/onboarding" className="text-[#C9A84C] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom Ticker */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#090F1E] border-t border-[#141E30] py-2 px-6 flex gap-8 text-[12px] font-mono text-[#8899BB]">
        {tickerPairs.map((item, i) => (
          <span key={i}>
            {item.pair}{" "}
            <span className={item.up ? "text-[#00E5A0]" : ""}>
              {item.price} {item.up ? "▲" : "▼"} {item.change}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
