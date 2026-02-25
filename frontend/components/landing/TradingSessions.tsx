import React from "react";

const sessions = [
  { name: "SYDNEY", open: "22:00", close: "07:00", pairs: "AUD, NZD, JPY", tz: "UTC", active: true },
  { name: "TOKYO", open: "00:00", close: "09:00", pairs: "JPY, AUD, NZD", tz: "UTC", active: true },
  { name: "LONDON", open: "08:00", close: "17:00", pairs: "EUR, GBP, CHF", tz: "UTC", active: false },
  { name: "NEW YORK", open: "13:00", close: "22:00", pairs: "USD, CAD, MXN", tz: "UTC", active: false },
];

const TradingSessions: React.FC = () => {
  return (
    <section id="sessions" className="max-w-[1400px] mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <span className="text-[#C9A84C] uppercase tracking-wider text-sm font-mono">
          {/* MARKET HOURS */}
        </span>
        <h2 className="text-white text-5xl md:text-6xl font-['Bebas_Neue'] mt-3 tracking-wide">
          TRADING SESSIONS
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {sessions.map((session) => (
          <div
            key={session.name}
            className={`bg-[#080E1A] border rounded-lg p-4.5 relative overflow-hidden ${
              session.active ? "border-[#003D2B]" : "border-[#1a2332]"
            }`}
          >
            {session.active && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#00E5A0]" />
            )}
            
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white font-['Bebas_Neue'] text-2xl tracking-wide">
                {session.name}
              </h3>
              {session.active && (
                <div className="flex items-center gap-1.5 bg-[#003D2B] px-2 py-1 rounded">
                  <span className="w-2 h-2 bg-[#00E5A0] rounded-full animate-pulse" />
                  <span className="text-[#00E5A0] text-xs font-mono font-medium uppercase">
                    LIVE NOW
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280] text-xs font-mono uppercase">Open</span>
                <span className="text-white font-mono text-sm">
                  {session.open} {session.tz}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#6B7280] text-xs font-mono uppercase">Close</span>
                <span className="text-white font-mono text-sm">
                  {session.close} {session.tz}
                </span>
              </div>
              <div className="pt-2 border-t border-[#1a2332]">
                <span className="text-[#6B7280] text-xs font-mono uppercase block mb-1">
                  Pairs
                </span>
                <span className="text-[#C9A84C] font-mono text-sm">
                  {session.pairs}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TradingSessions;
