// Re-export individual stores
export { useAuthStore } from './authStore';
export { usePriceStore, type PriceTick } from './priceStore';
export { useEAStore, type EAProject, type EAVersion } from './eaStore';
export { useUIStore } from './uiStore';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Position {
  ticket: string;
  pair: string;
  side: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  pnl: number;
  swap: number;
  openTime: string;
}

export interface AccountState {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  leverage: number;
  broker: string;
  accountNumber: string;
  accountType: 'Demo' | 'Live';
  server: string;
}

export interface Signal {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entryMin: number;
  entryMax: number;
  sl: number;
  tp: number;
  confidence: number;
  status: 'executed' | 'pending' | 'failed';
  strategy: string;
  timeAgo: string;
}

export interface EA {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'draft';
  pair: string;
  timeframe: string;
  lastModified: string;
  code: string;
}

// Account Store (with mock data for now - will be replaced by TanStack Query)
export interface AccountStore extends AccountState {
  setAccount: (account: Partial<AccountState>) => void;
  updateEquity: (pnl: number) => void;
  updateMargin: (used: number) => void;
}

export const useAccountStore = create<AccountStore>()(
  persist(
    (set) => ({
      balance: 10000,
      equity: 10043.20,
      margin: 108.43,
      freeMargin: 9891.57,
      marginLevel: 2093,
      leverage: 500,
      broker: 'Exness',
      accountNumber: '26489175',
      accountType: 'Demo',
      server: 'Exness-Demo',
      setAccount: (account) => set((state) => ({ ...state, ...account })),
      updateEquity: (pnl) => set((state) => ({ 
        equity: state.balance + pnl,
        marginLevel: Math.round((state.balance + pnl) / state.margin * 100)
      })),
      updateMargin: (used) => set((state) => ({ 
        margin: used,
        freeMargin: state.balance - used
      })),
    }),
    { name: 'forexelite-account' }
  )
);

// Positions Store (with mock data for now - will be replaced by TanStack Query)
export interface PositionsStore {
  positions: Position[];
  addPosition: (position: Position) => void;
  removePosition: (ticket: string) => void;
  updatePrices: (prices: Record<string, number>) => void;
  closeAll: () => void;
}

const initialPositions: Position[] = [
  { ticket: '264501', pair: 'EURUSD', side: 'BUY', volume: 0.01, openPrice: 1.08250, currentPrice: 1.08428, sl: 1.07500, tp: 1.09500, pnl: 17.80, swap: -0.40, openTime: '2026-02-23T08:30:00Z' },
  { ticket: '264502', pair: 'GBPUSD', side: 'SELL', volume: 0.02, openPrice: 1.27100, currentPrice: 1.26910, sl: 1.28000, tp: 1.25000, pnl: 38.00, swap: -0.80, openTime: '2026-02-23T09:15:00Z' },
  { ticket: '264503', pair: 'XAUUSD', side: 'BUY', volume: 0.01, openPrice: 2015.00, currentPrice: 2034.50, sl: 1990.00, tp: 2060.00, pnl: 195.00, swap: -0.20, openTime: '2026-02-23T10:00:00Z' },
  { ticket: '264504', pair: 'USDJPY', side: 'BUY', volume: 0.05, openPrice: 149.500, currentPrice: 149.820, sl: 148.500, tp: 151.000, pnl: 15.60, swap: -1.00, openTime: '2026-02-23T11:30:00Z' },
  { ticket: '264505', pair: 'AUDUSD', side: 'SELL', volume: 0.03, openPrice: 0.65800, currentPrice: 0.65420, sl: 0.66800, tp: 0.64000, pnl: 11.40, swap: 0, openTime: '2026-02-23T12:00:00Z' },
];

export const usePositionsStore = create<PositionsStore>()(
  persist(
    (set) => ({
      positions: initialPositions,
      addPosition: (position) => set((state) => ({ 
        positions: [...state.positions, position] 
      })),
      removePosition: (ticket) => set((state) => ({ 
        positions: state.positions.filter(p => p.ticket !== ticket)
      })),
      updatePrices: (prices) => set((state) => ({
        positions: state.positions.map(p => ({
          ...p,
          currentPrice: prices[p.pair] || p.currentPrice,
          pnl: calculatePnL(p, prices[p.pair] || p.currentPrice)
        }))
      })),
      closeAll: () => set({ positions: [] }),
    }),
    { name: 'forexelite-positions' }
  )
);

function calculatePnL(position: Position, currentPrice: number): number {
  const pipMultiplier = position.pair.includes('JPY') ? 100 : 10000;
  const priceDiff = position.side === 'BUY' 
    ? currentPrice - position.openPrice 
    : position.openPrice - currentPrice;
  return Math.round(priceDiff * pipMultiplier * position.volume * 10) / 10;
}

// Signals Store (with mock data for now - will be replaced by TanStack Query)
export interface SignalsStore {
  signals: Signal[];
  addSignal: (signal: Signal) => void;
  updateStatus: (id: string, status: Signal['status']) => void;
}

const initialSignals: Signal[] = [
  { id: '1', pair: 'EURUSD', direction: 'BUY', entryMin: 1.082, entryMax: 1.084, sl: 1.075, tp: 1.095, confidence: 85, status: 'executed', strategy: 'Trend-EMA', timeAgo: '2h ago' },
  { id: '2', pair: 'GBPUSD', direction: 'SELL', entryMin: 1.268, entryMax: 1.270, sl: 1.280, tp: 1.250, confidence: 78, status: 'executed', strategy: 'SMC-Liquidity', timeAgo: '4h ago' },
  { id: '3', pair: 'XAUUSD', direction: 'BUY', entryMin: 2015, entryMax: 2020, sl: 1990, tp: 2060, confidence: 92, status: 'executed', strategy: 'Gold-MA', timeAgo: '1h ago' },
  { id: '4', pair: 'USDJPY', direction: 'SELL', entryMin: 149.5, entryMax: 149.8, sl: 150.5, tp: 147.5, confidence: 65, status: 'pending', strategy: 'Mean-Reversion', timeAgo: '5h ago' },
  { id: '5', pair: 'AUDUSD', direction: 'BUY', entryMin: 0.652, entryMax: 0.655, sl: 0.645, tp: 0.670, confidence: 71, status: 'failed', strategy: 'Breakout-Volatility', timeAgo: '6h ago' },
];

export const useSignalsStore = create<SignalsStore>()(
  persist(
    (set) => ({
      signals: initialSignals,
      addSignal: (signal) => set((state) => ({ 
        signals: [signal, ...state.signals] 
      })),
      updateStatus: (id, status) => set((state) => ({
        signals: state.signals.map(s => s.id === id ? { ...s, status } : s)
      })),
    }),
    { name: 'forexelite-signals' }
  )
);

// EA Store (with mock data for now - will be replaced by TanStack Query)
export interface EAStore {
  eas: EA[];
  currentEA: EA | null;
  generatedCode: string;
  setGeneratedCode: (code: string) => void;
  addEA: (ea: EA) => void;
  updateEAStatus: (id: string, status: EA['status']) => void;
  deleteEA: (id: string) => void;
  setCurrentEA: (ea: EA | null) => void;
}

const initialEAs: EA[] = [
  { id: '1', name: 'Scalping Bot v2', status: 'running', pair: 'EURUSD', timeframe: 'M5', lastModified: '2026-02-22', code: '' },
  { id: '2', name: 'Trend Follower', status: 'paused', pair: 'GBPUSD', timeframe: 'H1', lastModified: '2026-02-20', code: '' },
  { id: '3', name: 'Grid System', status: 'draft', pair: 'XAUUSD', timeframe: 'M15', lastModified: '2026-02-18', code: '' },
];

export const useOldEAStore = create<EAStore>()(
  persist(
    (set) => ({
      eas: initialEAs,
      currentEA: null,
      generatedCode: '',
      setGeneratedCode: (code) => set({ generatedCode: code }),
      addEA: (ea) => set((state) => ({ eas: [...state.eas, ea] })),
      updateEAStatus: (id, status) => set((state) => ({
        eas: state.eas.map(e => e.id === id ? { ...e, status } : e)
      })),
      deleteEA: (id) => set((state) => ({ 
        eas: state.eas.filter(e => e.id !== id) 
      })),
      setCurrentEA: (ea) => set({ currentEA: ea }),
    }),
    { name: 'forexelite-ea' }
  )
);

// Ticker Store (with mock data for now - will be replaced by WebSocket)
export interface TickerItem {
  pair: string;
  price: number;
  change: number;
  changePercent: number;
}

export const useTickerStore = create<{ items: TickerItem[] }>()(
  persist(
    () => ({
      items: [
        { pair: 'EURUSD', price: 1.08428, change: 0.00452, changePercent: 0.42 },
        { pair: 'GBPUSD', price: 1.26910, change: 0.00392, changePercent: 0.31 },
        { pair: 'XAUUSD', price: 2034.50, change: 11.20, changePercent: 0.55 },
        { pair: 'USDJPY', price: 149.82, change: -0.18, changePercent: -0.12 },
        { pair: 'AUDUSD', price: 0.6542, change: 0.00052, changePercent: 0.08 },
        { pair: 'USDCAD', price: 1.3598, change: -0.00068, changePercent: -0.05 },
      ],
    }),
    { name: 'forexelite-ticker' }
  )
);
