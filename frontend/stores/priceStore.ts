import { create } from 'zustand';

export interface PriceTick {
  bid: number;
  ask: number;
  ts: number;
}

export interface PriceStore {
  prices: Record<string, PriceTick & { flash: 'up' | 'dn' | null }>;
  update: (pair: string, tick: { bid: number; ask: number }) => void;
}

const flashTimeouts: Record<string, NodeJS.Timeout> = {};

export const usePriceStore = create<PriceStore>()((set, get) => ({
  prices: {},
  
  update: (pair, tick) => {
    const current = get().prices[pair];
    const prevBid = current?.bid || tick.bid;
    
    let flash: 'up' | 'dn' | null = null;
    if (tick.bid > prevBid) {
      flash = 'up';
    } else if (tick.bid < prevBid) {
      flash = 'dn';
    }
    
    // Clear existing timeout for this pair
    if (flashTimeouts[pair]) {
      clearTimeout(flashTimeouts[pair]);
    }
    
    // Set flash reset after 500ms
    if (flash) {
      flashTimeouts[pair] = setTimeout(() => {
        set((state) => ({
          prices: {
            ...state.prices,
            [pair]: { ...state.prices[pair], flash: null },
          },
        }));
      }, 500);
    }
    
    set((state) => ({
      prices: {
        ...state.prices,
        [pair]: {
          bid: tick.bid,
          ask: tick.ask,
          ts: Date.now(),
          flash,
        },
      },
    }));
  },
}));
