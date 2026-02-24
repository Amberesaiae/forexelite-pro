"use client";

import Navigation from "@/components/landing/Navigation";
import Hero from "@/components/landing/Hero";
import Ticker from "@/components/landing/Ticker";
import Stats from "@/components/landing/Stats";
import SignalGenerator from "@/components/landing/SignalGenerator";
import TradingSessions from "@/components/landing/TradingSessions";
import RiskManagement from "@/components/landing/RiskManagement";
import StrategyLibrary from "@/components/landing/StrategyLibrary";
import EAGenerator from "@/components/landing/EAGenerator";
import BrokerConnect from "@/components/landing/BrokerConnect";
import CurrencyPairs from "@/components/landing/CurrencyPairs";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080E1A]">
      <Navigation />
      <Hero />
      <Ticker />
      <Stats />
      <SignalGenerator />
      <TradingSessions />
      <RiskManagement />
      <StrategyLibrary />
      <EAGenerator />
      <BrokerConnect />
      <CurrencyPairs />
      <Footer />
    </main>
  );
}
