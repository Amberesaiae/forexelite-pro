"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";

const navLinks = [
  { label: "Signals", href: "signals" },
  { label: "Risk Mgmt", href: "risk" },
  { label: "Library", href: "library" },
  { label: "EA Generator", href: "ea" },
  { label: "Broker Connect", href: "broker" },
  { label: "Pairs", href: "pairs" },
];

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] h-14 flex items-center justify-between px-6 bg-[rgba(4,8,15,0.95)] backdrop-blur-xl border-b border-[#141E30]">
      <a 
        className="text-xl font-['Bebas_Neue'] tracking-[3px] text-[#C9A84C] no-underline flex-shrink-0" 
        href="#"
      >
        FOREX<span className="text-[#EEF2FF]">ELITE</span> PRO
      </a>

      {/* Desktop Nav */}
      <ul className="hidden lg:flex gap-6 list-none items-center">
        {navLinks.map((item) => (
          <li key={item.href}>
            <button
              onClick={() => scrollTo(item.href)}
              className="text-[11px] font-medium tracking-[1.5px] uppercase text-[#8899BB] no-underline transition-colors hover:text-[#C9A84C] cursor-pointer bg-transparent border-none"
            >
              {item.label}
            </button>
          </li>
        ))}
        <li>
          <Link href="/onboarding">
            <Button className="bg-[#C9A84C] text-[#04080F] hover:bg-[#E8C97A]">
              Get Started
            </Button>
          </Link>
        </li>
      </ul>

      {/* Mobile Nav */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" className="lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
        </SheetTrigger>
        <SheetContent side="top" className="bg-[#04080F] border-[#141E30] w-full">
          <div className="flex flex-col gap-4 mt-8">
            {navLinks.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollTo(item.href)}
                className="text-left text-[13px] font-medium tracking-[1px] uppercase text-[#8899BB] py-2 border-b border-[#141E30]"
              >
                {item.label}
              </button>
            ))}
            <Link href="/onboarding" className="bg-[#C9A84C] text-[#04080F] hover:bg-[#E8C97A] w-full mt-4 text-center py-3 rounded font-bold">
              GET STARTED FREE
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

export default Navigation;
