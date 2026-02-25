"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Radio,
  Binary,
  Server,
  User,
  Settings,
  Bell,
  Menu,
  Search,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { usePriceStore } from "@/stores";

const DEFAULT_PAIRS = ["EURUSD", "GBPUSD", "XAUUSD", "USDJPY", "AUDUSD", "USDCAD"];
const WS_RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 30000];

const sidebarItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Live Trading", href: "/dashboard/trading", icon: TrendingUp },
  { name: "Positions", href: "/dashboard/positions", icon: Briefcase, badge: "5" },
  { name: "TV Signals", href: "/dashboard/signals", icon: Radio },
  { name: "EA Studio", href: "/dashboard/ea-studio", icon: Binary },
  { name: "Deployments", href: "/dashboard/deployments", icon: Server },
  { name: "Account", href: "/dashboard/account", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isAgentOffline, setIsAgentOffline] = useState(false);
  
  const updatePrice = usePriceStore((s) => s.update);
  const wsRefs = useRef<Map<string, WebSocket>>(new Map());
  const lastTickTime = useRef<Record<string, number>>({});
  const reconnectAttempt = useRef<Record<string, number>>({});
  const offlineCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const connectRef = useRef<((pair: string) => void) | null>(null);

  const connectWebSocket = useCallback((pair: string) => {
    if (wsRefs.current.has(pair)) return;

    const wsUrl = `ws://localhost:8000/api/v1/ws/prices/${pair}`;
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
    } catch {
      return;
    }

    ws.onopen = () => {
      reconnectAttempt.current[pair] = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const pairKey = data.pair || pair;
        updatePrice(pairKey, { bid: data.bid, ask: data.ask });
        lastTickTime.current[pairKey] = Date.now();
        setIsAgentOffline(false);
      } catch {}
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      wsRefs.current.delete(pair);
      const attempt = reconnectAttempt.current[pair] || 0;
      const delay = WS_RECONNECT_DELAYS[Math.min(attempt, WS_RECONNECT_DELAYS.length - 1)];
      reconnectAttempt.current[pair] = attempt + 1;
      if (connectRef.current) {
        setTimeout(() => connectRef.current!(pair), delay);
      }
    };

    wsRefs.current.set(pair, ws);
  }, [updatePrice]);

  useEffect(() => {
    connectRef.current = connectWebSocket;
  }, [connectWebSocket]);

  useEffect(() => {
    DEFAULT_PAIRS.forEach((pair) => connectWebSocket(pair));

    offlineCheckInterval.current = setInterval(() => {
      const now = Date.now();
      const allOffline = DEFAULT_PAIRS.every(
        (pair) => !lastTickTime.current[pair] || now - lastTickTime.current[pair] > 10000
      );
      setIsAgentOffline(allOffline);
    }, 1000);

    return () => {
      offlineCheckInterval.current && clearInterval(offlineCheckInterval.current);
      wsRefs.current.forEach((ws) => ws.close());
      wsRefs.current.clear();
    };
  }, [connectWebSocket]);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b border-[#131E32] px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-[3px] text-[#C9A84C]">
            FOREXELITE
          </span>
          <span className="bg-[#C9A84C] text-[#040810] text-[9px] px-1.5 py-0.5 rounded font-bold">
            PRO
          </span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                  : "text-[#8899BB] hover:bg-[#111929] hover:text-[#EEF2FF]"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {item.name}
              </div>
              {item.badge && (
                <span className="bg-[#FF4560]/20 text-[#FF4560] text-[10px] px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[#131E32] p-4">
        <div className="flex items-center gap-3 rounded-lg bg-[#0C1525] p-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#7A6130] to-[#C9A84C] flex items-center justify-center text-[#040810] font-bold text-sm">
            JT
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-[#EEF2FF]">John Trader</p>
            <p className="truncate text-[10px] text-[#C9A84C] font-mono">PRO PLAN</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#040810]">
      {isAgentOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#C9A84C] text-[#040810] px-4 py-2 flex items-center justify-center gap-2 text-[12px] font-mono font-bold">
          <span>⚠️ MT5 Agent offline — prices unavailable.</span>
          <a href="/dashboard/settings" className="underline hover:no-underline">Setup Agent →</a>
        </div>
      )}
      <div className={isAgentOffline ? "pt-10" : ""}>
      <div className="hidden md:fixed md:inset-y-0 md:z-50 md:flex md:w-[220px] md:flex-col">
        <div className="flex h-full flex-col bg-[#060B18]">
          <SidebarContent />
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-3.5 z-40 text-[#8899BB] hover:bg-[#111929]"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[220px] border-r border-[#131E32] bg-[#060B18] p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="md:pl-[220px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#131E32] bg-[#040810]/95 px-4 backdrop-blur-sm md:px-5">
          <div className="flex flex-1 items-center gap-4 md:ml-12">
            <div className="relative w-full max-w-xs hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3F5070]" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full border-0 bg-[#090F1E] pl-10 text-sm text-[#EEF2FF] placeholder:text-[#3F5070] focus-visible:ring-1 focus-visible:ring-[#C9A84C] focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#00E5A0] animate-pulse" />
              <span className="text-[10px] font-mono text-[#3F5070]">CONNECTED</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex items-center gap-2 border border-[#131E32] text-[#8899BB] hover:bg-[#111929] hover:text-[#EEF2FF]"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span className="text-[11px]">Exness Demo</span>
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-[#8899BB] hover:bg-[#111929] hover:text-[#EEF2FF]"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF4560] text-[8px] font-bold text-white">
                  3
                </span>
              </Button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-[#131E32] bg-[#090F1E] shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#131E32] px-4 py-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#3F5070]">
                      Notifications
                    </span>
                    <span className="cursor-pointer text-[9px] font-mono text-[#7A6130] hover:text-[#C9A84C]">
                      Clear All
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {[
                      { title: "Trade Executed", body: "BUY EURUSD 0.01 @ 1.08428", time: "2 min ago" },
                      { title: "TV Signal Received", body: 'XAUUSD — SELL from strategy "Gold-MA"', time: "14 min ago" },
                      { title: "EA Compilation Complete", body: "Scalping Bot v2 — .ex5 ready", time: "1 hour ago" },
                    ].map((notif, i) => (
                      <div key={i} className="border-b border-[#131E32]/60 px-4 py-3 last:border-0">
                        <p className="text-[11px] font-medium text-[#EEF2FF]">{notif.title}</p>
                        <p className="mt-0.5 text-[10px] font-mono text-[#8899BB]">{notif.body}</p>
                        <p className="mt-1 text-[9px] text-[#3F5070]">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              asChild
              className="bg-[#C9A84C] text-[#040810] hover:bg-[#E8C97A] text-[11px] h-8 font-bold"
            >
              <Link href="/dashboard/trading">+ Order</Link>
            </Button>
          </div>
        </header>

        <main className="p-4 md:p-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
