"use client";

const stats = [
  { value: "47+", label: "Strategies" },
  { value: "28", label: "Currency Pairs" },
  { value: "9", label: "Timeframes" },
  { value: "6", label: "Brokers" },
  { value: "26Y", label: "Experience" },
  { value: "24/5", label: "Coverage" },
];

export function Stats() {
  return (
    <section className="max-w-[1400px] mx-auto px-6 py-16">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-[#141E30] border border-[#141E30] rounded-lg overflow-hidden">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#080E1A] py-6 px-4 text-center">
            <div className="text-[clamp(28px,4vw,44px)] font-['Bebas_Neue'] tracking-[1px] text-[#C9A84C] leading-none mb-1.5">
              {stat.value}
            </div>
            <div className="text-[9px] tracking-[2px] uppercase text-[#445577] font-mono">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Stats;
