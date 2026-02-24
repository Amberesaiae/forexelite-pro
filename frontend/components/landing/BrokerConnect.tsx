"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Broker {
  id: string;
  name: string;
  spread: string;
  status: "connected" | "disconnected" | "connecting";
}

const BROKERS: Broker[] = [
  { id: "icmarkets", name: "IC Markets", spread: "0.0 pips", status: "disconnected" },
  { id: "pepperstone", name: "Pepperstone", spread: "0.0 pips", status: "disconnected" },
  { id: "oanda", name: "OANDA", spread: "0.2 pips", status: "disconnected" },
  { id: "xm", name: "XM", spread: "0.0 pips", status: "disconnected" },
  { id: "fbs", name: "FBS", spread: "0.0 pips", status: "disconnected" },
  { id: "octafx", name: "OctaFX", spread: "0.2 pips", status: "disconnected" },
  { id: "exness", name: "Exness", spread: "0.0 pips", status: "disconnected" },
  { id: "roboforex", name: "RoboForex", spread: "0.0 pips", status: "disconnected" },
];

export function BrokerConnect() {
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [server, setServer] = useState("demo");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [brokers, setBrokers] = useState<Broker[]>(BROKERS);

  const handleConnect = async () => {
    if (!selectedBroker || !login || !password) return;

    setIsConnecting(true);
    setBrokers((prev) =>
      prev.map((b) =>
        b.id === selectedBroker ? { ...b, status: "connecting" } : b
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    setBrokers((prev) =>
      prev.map((b) =>
        b.id === selectedBroker ? { ...b, status: "connected" } : b
      )
    );
    setIsConnecting(false);
  };

  const handleBrokerSelect = (brokerId: string) => {
    setSelectedBroker(brokerId);
  };

  const getStatusBadge = (status: Broker["status"]) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-[#00E5A0]/10 text-[#00E5A0] border-[#00E5A0]/30 hover:bg-[#00E5A0]/10">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case "connecting":
        return (
          <Badge className="bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30 hover:bg-[#C9A84C]/10">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Connecting
          </Badge>
        );
      default:
        return (
          <Badge className="bg-[#8899BB]/10 text-[#8899BB] border-[#8899BB]/30 hover:bg-[#8899BB]/10">
            <XCircle className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        );
    }
  };

  return (
    <section id="brokers" className="py-20 px-6 relative">
      <div className="absolute inset-0 bg-[#0A0A0A]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,168,76,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.03) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-[1400px] mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Connect Your <span className="text-[#C9A84C]">Broker</span>
          </h2>
          <p className="text-[#8899BB] max-w-xl mx-auto">
            Link your trading account to unlock real-time signals, automated strategies, and intelligent risk management.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
          {brokers.map((broker, index) => (
            <motion.div
              key={broker.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-200 ${
                  selectedBroker === broker.id
                    ? "border-[#C9A84C] bg-[#C9A84C]/5"
                    : "border-[#1a1a1a] bg-[#141414] hover:border-[#333] hover:bg-[#1a1a1a]"
                }`}
                onClick={() => handleBrokerSelect(broker.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#C9A84C] font-bold text-sm">
                        {broker.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <CardTitle className="text-white text-sm">
                        {broker.name}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8899BB] text-xs">
                      Spread: <span className="text-white">{broker.spread}</span>
                    </span>
                    {getStatusBadge(broker.status)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="border-[#1a1a1a] bg-[#141414] max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-white text-lg text-center">
                Connection Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-[#8899BB] uppercase tracking-wide">
                  Server
                </label>
                <Select value={server} onValueChange={setServer}>
                  <SelectTrigger className="bg-[#0A0A0A] border-[#1a1a1a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#141414] border-[#1a1a1a]">
                    <SelectItem
                      value="demo"
                      className="text-white focus:bg-[#1a1a1a] focus:text-white"
                    >
                      Demo
                    </SelectItem>
                    <SelectItem
                      value="live"
                      className="text-white focus:bg-[#1a1a1a] focus:text-white"
                    >
                      Live
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#8899BB] uppercase tracking-wide">
                  Login
                </label>
                <Input
                  type="text"
                  placeholder="Enter your login ID"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="bg-[#0A0A0A] border-[#1a1a1a] text-white placeholder:text-[#555]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[#8899BB] uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#0A0A0A] border-[#1a1a1a] text-white placeholder:text-[#555] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8899BB] hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleConnect}
                disabled={!selectedBroker || !login || !password || isConnecting}
                className="w-full bg-[#C9A84C] text-[#04080F] hover:bg-[#E8C97A] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

export default BrokerConnect;
