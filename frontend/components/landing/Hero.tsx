"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Hero() {
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section 
      id="home" 
      className="min-h-[100svh] flex flex-col justify-center px-6 pt-20 pb-16 relative overflow-hidden"
    >
      {/* Background Effects */}
      <div
        className="absolute inset-0 opacity-[0.04] animate-grid"
        style={{
          backgroundImage: "linear-gradient(rgba(201,168,76,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.04) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute w-[min(600px,80vw)] h-[min(600px,80vw)] bg-[radial-gradient(circle,rgba(201,168,76,0.12)_0%,transparent_70%)] -top-24 -right-24 rounded-full" />
      <div className="absolute w-[min(400px,60vw)] h-[min(400px,60vw)] bg-[radial-gradient(circle,rgba(61,133,255,0.08)_0%,transparent_70%)] bottom-0 left-24 rounded-full" />

      <div className="max-w-[1200px] mx-auto w-full relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 text-[10px] tracking-[2.5px] uppercase text-[#C9A84C] font-mono mb-5 px-3 py-1.5 border border-[#7A6130] rounded"
        >
          <span className="w-1.5 h-1.5 bg-[#00E5A0] rounded-full animate-pulse" />
          INSTITUTIONAL GRADE TRADING INTELLIGENCE
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-[clamp(52px,10vw,120px)] font-['Bebas_Neue'] leading-[0.9] tracking-[2px] mb-5"
        >
          TRADE LIKE<br />
          <span className="text-[#C9A84C]">SMART</span><br />MONEY
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-[clamp(13px,2vw,16px)] text-[#8899BB] max-w-[560px] leading-[1.7] font-light mb-10"
        >
          Complete forex ecosystem — SMC signals, rule-based strategies, precision risk management, MT5 EA generation, and multi-broker connectivity. All in one platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex gap-3 flex-wrap"
        >
          <Button
            onClick={() => scrollTo("signals")}
            className="bg-[#C9A84C] text-[#04080F] hover:bg-[#E8C97A] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(201,168,76,0.3)]"
          >
            Generate Signals
          </Button>
          <Button
            onClick={() => scrollTo("library")}
            variant="outline"
            className="border-[#141E30] text-[#EEF2FF] hover:border-[#7A6130] hover:text-[#C9A84C]"
          >
            Strategy Library
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
