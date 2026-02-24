'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Building2, 
  Settings, 
  LogOut, 
  X, 
  Plus, 
  Trash2,
  ChevronRight,
  TrendingUp,
  History,
  BarChart3
} from 'lucide-react';

interface Position {
  position_id: string;
  instrument: string;
  side: string;
  quantity: number;
  entry_price: number;
  current_price?: number;
  unrealized_pnl?: number;
}

interface AccountInfo {
  account_id: string;
  balance: number;
  equity: number;
  margin_used: number;
  margin_available: number;
  margin_ratio: number;
}

interface Broker {
  id: string;
  name: string;
  broker_type: string;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

type BottomTab = 'positions' | 'history' | 'analytics';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<string>('');
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'brokers' | 'settings'>('profile');
  const [loggingOut, setLoggingOut] = useState(false);
  
  // Bottom tab state
  const [bottomTab, setBottomTab] = useState<BottomTab>('positions');
  
  // Initialize bottom tab from URL query param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'positions' || tabParam === 'history' || tabParam === 'analytics') {
      setBottomTab(tabParam);
    }
  }, [searchParams]);

  // Handle bottom tab change with URL update
  const handleBottomTabChange = (tab: BottomTab) => {
    setBottomTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };
  
  const [instruments] = useState([
    'EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD', 'NZD_USD',
    'XAU_USD', 'XAG_USD', 'US30_USD', 'NAS100_USD', 'SPX500_USD'
  ]);
  const [selectedInstrument, setSelectedInstrument] = useState('EUR_USD');
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [currentAsk, setCurrentAsk] = useState<number>(0);
  const [wsConnected, setWsConnected] = useState(false);
  
  // Order form state
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [lotSize, setLotSize] = useState(0.10);
  const [slPips, setSlPips] = useState<number>(0);
  const [tpPips, setTpPips] = useState<number>(0);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Chart refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Mock analytics data
  const analyticsData = {
    balance: 100000,
    totalTrades: 47,
    winRate: 68,
    totalPnl: 3420.50,
    winningTrades: 32,
    losingTrades: 15,
    avgWin: 185.30,
    avgLoss: -95.75,
    profitFactor: 2.15,
    largestWin: 890.25,
    largestLoss: -245.00,
    currentStreak: 5,
    longestWinStreak: 8,
    longestLossStreak: 3,
  };

  // Check auth and fetch initial data
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setUserProfile({
          id: user.id,
          email: user.email || '',
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
        });
      } else {
        setUserProfile({
          id: user.id,
          email: user.email || '',
        });
      }
      
      // Fetch brokers
      const { data: brokerData } = await supabase
        .from('broker_connections')
        .select('id, name, broker_type')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (brokerData && brokerData.length > 0) {
        setBrokers(brokerData);
        setSelectedBroker(brokerData[0].id);
      } else {
        router.push('/onboarding');
        return;
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, [router, supabase]);

  // Fetch account and trade events when broker changes
  useEffect(() => {
    if (!selectedBroker) return;
    
    const fetchData = async () => {
      // Fetch account from profiles
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setAccount({
          account_id: selectedBroker,
          balance: 100000, // Default demo balance - real balance comes from broker API
          equity: 100000,
          margin_used: 0,
          margin_available: 100000,
          margin_ratio: 100,
        });
      }
      
      // Fetch trade history from trade_events (instead of positions which doesn't exist)
      const { data: tradeData } = await supabase
        .from('trade_events')
        .select('*')
        .eq('broker_connection_id', selectedBroker)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (tradeData) {
        setPositions(tradeData.map((t: any) => ({
          position_id: t.id,
          instrument: t.pair,
          side: t.direction?.toLowerCase() || 'buy',
          quantity: t.quantity,
          entry_price: t.entry_price,
          current_price: t.exit_price,
          unrealized_pnl: t.profit_loss,
        })));
      }
    };
    
    fetchData();
  }, [selectedBroker, supabase]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f0f1a' },
        textColor: '#9090a8',
      },
      grid: {
        vertLines: { color: '#2a2a4a' },
        horzLines: { color: '#2a2a4a' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    
    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    
    // Fetch initial candles
    fetchCandles();
    
    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!selectedInstrument) return;
    
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws/prices/${selectedInstrument}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      setWsConnected(true);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'tick') {
        const tick = data.data;
        setCurrentBid(parseFloat(tick.bid));
        setCurrentAsk(parseFloat(tick.ask));
        
        // Update chart with current candle
        if (seriesRef.current) {
          const now = Math.floor(Date.now() / 1000);
          seriesRef.current.update({
            time: now as any,
            close: parseFloat(tick.bid),
          });
        }
        
        // Update positions P&L
        setPositions(prev => prev.map(p => {
          if (p.instrument === selectedInstrument) {
            const currentPrice = tick.bid;
            const entryPrice = p.entry_price;
            const pnl = p.side === 'buy'
              ? (currentPrice - entryPrice) * p.quantity * 100000
              : (entryPrice - currentPrice) * p.quantity * 100000;
            return { ...p, current_price: currentPrice, unrealized_pnl: pnl };
          }
          return p;
        }));
      }
    };
    
    ws.onclose = () => {
      setWsConnected(false);
    };
    
    ws.onerror = () => {
      setWsConnected(false);
    };
    
    return () => {
      ws.close();
    };
  }, [selectedInstrument]);

  const fetchCandles = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/candles/${selectedInstrument}?granularity=M1&count=200`
      );
      const data = await response.json();
      
      if (data.candles && seriesRef.current) {
        const candles: Candle[] = data.candles.map((c: any) => ({
          time: c.time,
          open: parseFloat(c.open),
          high: parseFloat(c.high),
          low: parseFloat(c.low),
          close: parseFloat(c.close),
          volume: c.volume,
        }));
        
        seriesRef.current.setData(candles);
      }
    } catch (error) {
      console.error('Failed to fetch candles:', error);
    }
  };

  // Risk calculator
  const calculateRisk = useCallback(() => {
    const pipValue = lotSize * 10; // Simplified pip value
    const marginRequired = lotSize * 100000 * currentAsk / 100; // 1% margin
    const maxLoss = slPips * pipValue;
    return { pipValue, marginRequired, maxLoss };
  }, [lotSize, slPips, currentAsk]);

  const risk = calculateRisk();

  const handlePlaceOrder = async () => {
    if (!selectedBroker) return;
    
    setOrderSubmitting(true);
    setOrderStatus('idle');
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/trading/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            broker_connection_id: selectedBroker,
            instrument: selectedInstrument,
            order_type: 'market',
            side: orderSide,
            quantity: lotSize,
            sl_pips: slPips,
            tp_pips: tpPips,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Order failed');
      }
      
      setOrderStatus('success');
      setTimeout(() => setOrderStatus('idle'), 2000);
      
      // Refresh positions
      const { data: positionData } = await supabase
        .from('positions')
        .select('*')
        .eq('broker_connection_id', selectedBroker);
      
      if (positionData) {
        setPositions(positionData.map((p: any) => ({
          position_id: p.id,
          instrument: p.pair,
          side: p.direction.toLowerCase(),
          quantity: p.quantity,
          entry_price: p.entry_price,
          current_price: p.current_price,
          unrealized_pnl: p.profit_loss,
        })));
      }
    } catch (error) {
      setOrderStatus('error');
      setTimeout(() => setOrderStatus('idle'), 2000);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleClosePosition = async (positionId: string) => {
    if (!selectedBroker) return;
    
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/trading/positions/${positionId}?broker_connection_id=${selectedBroker}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );
      
      setPositions(prev => prev.filter(p => p.position_id !== positionId));
    } catch (error) {
      console.error('Failed to close position:', error);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setLoggingOut(false);
    }
  };

  const handleRemoveBroker = async (brokerId: string) => {
    try {
      await supabase
        .from('broker_connections')
        .update({ is_active: false })
        .eq('id', brokerId);
      
      setBrokers(prev => prev.filter(b => b.id !== brokerId));
      
      if (selectedBroker === brokerId && brokers.length > 1) {
        const remaining = brokers.filter(b => b.id !== brokerId);
        setSelectedBroker(remaining[0].id);
      }
    } catch (error) {
      console.error('Failed to remove broker:', error);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'brokers' as const, label: 'Brokers', icon: Building2 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  const bottomTabs = [
    { id: 'positions' as const, label: 'Positions', icon: TrendingUp },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#f5a623] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Top bar */}
      <header className="border-b border-[#2a2a4a] bg-[#16162a] px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">ForexElite Pro</h1>
          
          <div className="flex items-center gap-4">
            {/* Broker selector */}
            <select
              value={selectedBroker}
              onChange={(e) => setSelectedBroker(e.target.value)}
              className="rounded-lg border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-2 text-foreground"
            >
              {brokers.map(broker => (
                <option key={broker.id} value={broker.id}>
                  {broker.name} ({broker.broker_type})
                </option>
              ))}
            </select>
            
            {/* Instrument selector */}
            <select
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(e.target.value)}
              className="rounded-lg border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-2 text-foreground"
            >
              {instruments.map(inst => (
                <option key={inst} value={inst}>
                  {inst.replace('_', '/')}
                </option>
              ))}
            </select>
            
            {/* Price display */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#22c55e]">{currentBid.toFixed(5)}</span>
              <span className="text-[#9090a8]">/</span>
              <span className="text-[#ef4444]">{currentAsk.toFixed(5)}</span>
            </div>
            
            {/* Connection status */}
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
            
            {/* Account info */}
            {account && (
              <div className="text-right text-sm">
                <div className="text-[#9090a8]">Balance</div>
                <div className="font-mono text-foreground">${account.balance.toLocaleString()}</div>
              </div>
            )}
            
            {/* Account button */}
            <button
              onClick={() => setAccountPanelOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2a2a4a] bg-[#1e1e3f] hover:bg-[#2a2a4a] transition-colors"
            >
              <User className="w-4 h-4 text-[#f5a623]" />
              <span className="text-foreground">Account</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex">
        {/* Chart area */}
        <div className="flex-1 p-6">
          <div ref={chartContainerRef} className="w-full h-[400px]" />
        </div>
        
        {/* Order panel */}
        <div className="w-80 border-l border-[#2a2a4a] bg-[#16162a] p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Place Order</h2>
          
          {/* Buy/Sell toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setOrderSide('buy')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                orderSide === 'buy'
                  ? 'bg-[#22c55e] text-[#0f0f1a]'
                  : 'bg-[#1e1e3f] text-foreground hover:bg-[#2a2a4a]'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setOrderSide('sell')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                orderSide === 'sell'
                  ? 'bg-[#ef4444] text-[#0f0f1a]'
                  : 'bg-[#1e1e3f] text-foreground hover:bg-[#2a2a4a]'
              }`}
            >
              SELL
            </button>
          </div>
          
          {/* Lot size */}
          <div className="mb-4">
            <label className="block text-sm text-[#9090a8] mb-2">Lot Size</label>
            <input
              type="number"
              value={lotSize}
              onChange={(e) => setLotSize(parseFloat(e.target.value))}
              step="0.01"
              min="0.01"
              className="w-full rounded-lg border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-2 text-foreground"
            />
          </div>
          
          {/* Stop loss */}
          <div className="mb-4">
            <label className="block text-sm text-[#9090a8] mb-2">Stop Loss (pips)</label>
            <input
              type="number"
              value={slPips}
              onChange={(e) => setSlPips(parseFloat(e.target.value))}
              step="1"
              min="0"
              className="w-full rounded-lg border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-2 text-foreground"
            />
          </div>
          
          {/* Take profit */}
          <div className="mb-4">
            <label className="block text-sm text-[#9090a8] mb-2">Take Profit (pips)</label>
            <input
              type="number"
              value={tpPips}
              onChange={(e) => setTpPips(parseFloat(e.target.value))}
              step="1"
              min="0"
              className="w-full rounded-lg border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-2 text-foreground"
            />
          </div>
          
          {/* Risk calculator */}
          <div className="rounded-lg bg-[#1e1e3f] p-4 mb-4">
            <div className="text-sm text-[#9090a8] mb-2">Risk Calculator</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#9090a8]">Pip Value:</span>
                <span className="text-foreground">${risk.pipValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9090a8]">Margin Required:</span>
                <span className="text-foreground">${risk.marginRequired.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9090a8]">Max Loss:</span>
                <span className={risk.maxLoss > 0 ? 'text-[#ef4444]' : 'text-foreground'}>
                  ${risk.maxLoss.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Submit button */}
          <button
            onClick={handlePlaceOrder}
            disabled={orderSubmitting || currentBid === 0}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              orderSide === 'buy'
                ? 'bg-[#22c55e] text-[#0f0f1a] hover:bg-[#16a34a]'
                : 'bg-[#ef4444] text-[#0f0f1a] hover:bg-[#dc2626]'
            } disabled:opacity-50`}
          >
            {orderSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : orderStatus === 'success' ? (
              '✓ Order Placed'
            ) : orderStatus === 'error' ? (
              'Order Failed'
            ) : (
              `Place ${orderSide.toUpperCase()} Order`
            )}
          </button>
        </div>
      </div>
      
      {/* Bottom Tab Section */}
      <div className="border-t border-[#2a2a4a]">
        {/* Tab Bar */}
        <div className="border-b border-[#2a2a4a] px-6">
          <div className="flex">
            {bottomTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleBottomTabChange(tab.id)}
                className={`py-3 px-4 transition-colors duration-200 relative ${
                  bottomTab === tab.id
                    ? 'text-[#f5a623]'
                    : 'text-[#9090a8] hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </div>
                {bottomTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f5a623]" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Positions Tab */}
          {bottomTab === 'positions' && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Open Positions</h2>
              
              {positions.length === 0 ? (
                <div className="text-center py-8 text-[#9090a8]">
                  No open positions
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-[#9090a8]">
                        <th className="pb-3">Instrument</th>
                        <th className="pb-3">Side</th>
                        <th className="pb-3">Size</th>
                        <th className="pb-3">Entry Price</th>
                        <th className="pb-3">Current</th>
                        <th className="pb-3">P&L</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map(position => (
                        <tr key={position.position_id} className="border-t border-[#2a2a4a]">
                          <td className="py-3 text-foreground">{position.instrument.replace('_', '/')}</td>
                          <td className={`py-3 font-medium ${position.side === 'buy' ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                            {position.side.toUpperCase()}
                          </td>
                          <td className="py-3 text-foreground">{position.quantity}</td>
                          <td className="py-3 text-foreground">{position.entry_price.toFixed(5)}</td>
                          <td className="py-3 text-foreground">{position.current_price?.toFixed(5) || '-'}</td>
                          <td className={`py-3 font-mono ${position.unrealized_pnl && position.unrealized_pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                            {position.unrealized_pnl ? `$${position.unrealized_pnl.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => handleClosePosition(position.position_id)}
                              className="text-sm text-[#9090a8] hover:text-[#ef4444] transition-colors"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {/* History Tab */}
          {bottomTab === 'history' && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Trade History</h2>
              
              <div className="text-center py-8 text-[#9090a8]">
                No trade history yet
              </div>
            </div>
          )}
          
          {/* Analytics Tab */}
          {bottomTab === 'analytics' && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Balance Card */}
                <div className="rounded-lg bg-[#16162a] border border-[#2a2a4a] p-4">
                  <div className="text-sm text-[#9090a8] mb-1">Balance</div>
                  <div className="text-2xl font-bold text-foreground">
                    ${analyticsData.balance.toLocaleString()}
                  </div>
                </div>
                
                {/* Total Trades Card */}
                <div className="rounded-lg bg-[#16162a] border border-[#2a2a4a] p-4">
                  <div className="text-sm text-[#9090a8] mb-1">Total Trades</div>
                  <div className="text-2xl font-bold text-foreground">
                    {analyticsData.totalTrades}
                  </div>
                </div>
                
                {/* Win Rate Card */}
                <div className="rounded-lg bg-[#16162a] border border-[#2a2a4a] p-4">
                  <div className="text-sm text-[#9090a8] mb-1">Win Rate</div>
                  <div className="text-2xl font-bold text-[#22c55e]">
                    {analyticsData.winRate}%
                  </div>
                </div>
                
                {/* Total P&L Card */}
                <div className="rounded-lg bg-[#16162a] border border-[#2a2a4a] p-4">
                  <div className="text-sm text-[#9090a8] mb-1">Total P&L</div>
                  <div className={`text-2xl font-bold ${analyticsData.totalPnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    {analyticsData.totalPnl >= 0 ? '+' : ''}${analyticsData.totalPnl.toLocaleString()}
                  </div>
                </div>
                
                {/* Winning Trades */}
                <div className="rounded-lg bg-[#16162a] border border-[#2a2a4a] p-4">
                  <div className="text-sm text-[#9090a8] mb-1">Winning Trades</div>
                  <div className="text-2xl font-bold text-[#22c55e]">
                    {analyticsData.winningTrades}
                  </div>
                </div>
                
                {/* Losing Trades */}
                <div className="rounded-lg bg-[#16162a] border border-[#2a2a4a] p-4">
                  <div className="text-sm text-[#9090a8] mb-1">Losing Trades</div>
                  <div className="text-2xl font-bold text-[#ef4444]">
                    {analyticsData.losingTrades}
                  </div>
                </div>
                
                {/* Average Win */}
                <div className="rounded-lg bg-[#16162a] border border-[#2a2a4a] p-4">
                  <div className="text-sm text-[#9090a8] mb-1">Average Win</div>
                  <div className="text-2xl font-bold text-[#22c55e]">
                    ${analyticsData.avgWin.toFixed(2)}
                  </div>
                </div>
                
                {/* Average Loss */}
                <div className="rounded-lg bg-[#16162a] border border-[#2a2a4a] p-4">
                  <div className="text-sm text-[#9090a8] mb-1">Average Loss</div>
                  <div className="text-2xl font-bold text-[#ef4444]">
                    ${analyticsData.avgLoss.toFixed(2)}
                  </div>
                </div>
                
                {/* Profit Factor */}
                <div className="rounded-lg bg-[#16162a] border border-[#2a2a4a] p-4">
                  <div className="text-sm text-[#9090a8] mb-1">Profit Factor</div>
                  <div className="text-2xl font-bold text-foreground">
                    {analyticsData.profitFactor.toFixed(2)}
                  </div>
                </div>
                
                {/* Largest Win */}
                <div className="rounded-lg bg-[#16162a] border border-[#2a2a4a] p-4">
                  <div className="text-sm text-[#9090a8] mb-1">Largest Win</div>
                  <div className="text-2xl font-bold text-[#22c55e]">
                    ${analyticsData.largestWin.toFixed(2)}
                  </div>
                </div>
                
                {/* Largest Loss */}
                <div className="rounded-lg bg-[#16162a] border border-[#2a2a4a] p-4">
                  <div className="text-sm text-[#9090a8] mb-1">Largest Loss</div>
                  <div className="text-2xl font-bold text-[#ef4444]">
                    ${analyticsData.largestLoss.toFixed(2)}
                  </div>
                </div>
                
                {/* Current Streak */}
                <div className="rounded-lg bg-[#16162a] border border-[#2a2a4a] p-4">
                  <div className="text-sm text-[#9090a8] mb-1">Current Streak</div>
                  <div className={`text-2xl font-bold ${analyticsData.currentStreak >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    {analyticsData.currentStreak > 0 ? `+${analyticsData.currentStreak}` : analyticsData.currentStreak}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Slide-out Panel */}
      <AnimatePresence>
        {accountPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAccountPanelOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            
            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[400px] bg-[#16162a] border-l border-[#2a2a4a] z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2a2a4a]">
                <h2 className="text-lg font-semibold text-foreground">Account</h2>
                <button
                  onClick={() => setAccountPanelOpen(false)}
                  className="p-2 rounded-lg hover:bg-[#1e1e3f] transition-colors"
                >
                  <X className="w-5 h-5 text-[#9090a8]" />
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex border-b border-[#2a2a4a]">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? 'text-[#f5a623]'
                        : 'text-[#9090a8] hover:text-foreground'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f5a623]"
                      />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#1e1e3f] flex items-center justify-center">
                        <User className="w-8 h-8 text-[#f5a623]" />
                      </div>
                      <div>
                        <div className="text-lg font-medium text-foreground">
                          {userProfile?.full_name || 'User'}
                        </div>
                        <div className="text-sm text-[#9090a8]">
                          {userProfile?.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg bg-[#1e1e3f]">
                        <div className="text-sm text-[#9090a8]">Account ID</div>
                        <div className="text-foreground font-mono text-sm mt-1">
                          {userProfile?.id?.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Brokers Tab */}
                {activeTab === 'brokers' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-[#9090a8]">Connected Brokers</h3>
                      <button className="flex items-center gap-1 text-sm text-[#f5a623] hover:text-[#d4921f] transition-colors">
                        <Plus className="w-4 h-4" />
                        Add Broker
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {brokers.map((broker) => (
                        <div
                          key={broker.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-[#1e1e3f] border border-[#2a2a4a]"
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-[#f5a623]" />
                            <div>
                              <div className="text-foreground font-medium">{broker.name}</div>
                              <div className="text-xs text-[#9090a8]">{broker.broker_type}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveBroker(broker.id)}
                            className="p-2 text-[#9090a8] hover:text-[#ef4444] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {brokers.length === 0 && (
                      <div className="text-center py-8 text-[#9090a8]">
                        No brokers connected
                      </div>
                    )}
                  </div>
                )}
                
                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-[#1e1e3f] text-center">
                      <Settings className="w-8 h-8 text-[#9090a8] mx-auto mb-2" />
                      <div className="text-[#9090a8]">Settings coming soon</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Logout Button */}
              <div className="p-4 border-t border-[#2a2a4a]">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#1e1e3f] text-[#ef4444] hover:bg-[#2a2a4a] transition-colors disabled:opacity-50"
                >
                  {loggingOut ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  {loggingOut ? 'Logging out...' : 'Logout'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
