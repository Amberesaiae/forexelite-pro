"use client";

import { Twitter, MessageCircle, Send } from "lucide-react";

const products = [
  { label: "Signals", href: "#signals" },
  { label: "EA Builder", href: "#ea" },
  { label: "Strategy Library", href: "#library" },
  { label: "Broker Connect", href: "#broker" },
  { label: "Currency Pairs", href: "#pairs" },
];

const company = [
  { label: "About", href: "#about" },
  { label: "Pricing", href: "#pricing" },
  { label: "Blog", href: "#blog" },
  { label: "Contact", href: "#contact" },
];

const legal = [
  { label: "Terms of Service", href: "#terms" },
  { label: "Privacy Policy", href: "#privacy" },
  { label: "Risk Disclaimer", href: "#risk" },
];

export function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[#141E30]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo + Tagline */}
          <div className="space-y-4">
            <a 
              className="text-xl font-['Bebas_Neue'] tracking-[3px] text-[#C9A84C] no-underline flex-shrink-0" 
              href="#"
            >
              FOREX<span className="text-[#EEF2FF]">ELITE</span> PRO
            </a>
            <p className="text-[#8899BB] text-sm leading-relaxed">
              Professional Forex Trading Tools
            </p>
            <div className="flex gap-4 pt-2">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#8899BB] hover:text-[#C9A84C] transition-colors"
              >
                <Twitter className="w-5 h-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a 
                href="https://discord.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#8899BB] hover:text-[#C9A84C] transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="sr-only">Discord</span>
              </a>
              <a 
                href="https://telegram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#8899BB] hover:text-[#C9A84C] transition-colors"
              >
                <Send className="w-5 h-5" />
                <span className="sr-only">Telegram</span>
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-[#EEF2FF] font-medium text-sm tracking-[1.5px] uppercase mb-4">
              Products
            </h4>
            <ul className="space-y-3">
              {products.map((item) => (
                <li key={item.href}>
                  <a 
                    href={item.href}
                    className="text-[#8899BB] text-sm hover:text-[#C9A84C] transition-colors no-underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[#EEF2FF] font-medium text-sm tracking-[1.5px] uppercase mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item.href}>
                  <a 
                    href={item.href}
                    className="text-[#8899BB] text-sm hover:text-[#C9A84C] transition-colors no-underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[#EEF2FF] font-medium text-sm tracking-[1.5px] uppercase mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              {legal.map((item) => (
                <li key={item.href}>
                  <a 
                    href={item.href}
                    className="text-[#8899BB] text-sm hover:text-[#C9A84C] transition-colors no-underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#141E30] mt-12 pt-8">
          <p className="text-[#8899BB] text-sm text-center">
            © 2024 ForexElite Pro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
