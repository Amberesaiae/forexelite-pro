import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Re-export individual stores
export { useAuthStore } from './authStore';
export { usePriceStore, type PriceTick } from './priceStore';
export { useEAStore, type EAProject, type EAVersion } from './eaStore';
export { useUIStore } from './uiStore';

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

export interface EA {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'draft';
  pair: string;
  timeframe: string;
  lastModified: string;
  code: string;
}

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
