import { create } from "zustand";
import { Side } from "@/types/engine";
import type { OrderPreview } from "@/types/market";

interface TradeState {
  /** Long or Short */
  side: Side;

  /** Size in USDC (string for input binding) */
  sizeUsdc: string;

  /** Leverage multiplier (1-20) */
  leverage: number;

  /** Take profit price (string for input binding) */
  takeProfitPrice: string;

  /** Stop loss price (string for input binding) */
  stopLossPrice: string;

  /** Computed order preview (null if inputs incomplete) */
  preview: OrderPreview | null;

  /** Whether TP/SL section is expanded */
  showTpSl: boolean;
}

interface TradeActions {
  setSide: (side: Side) => void;
  setSize: (size: string) => void;
  setLeverage: (leverage: number) => void;
  setTakeProfitPrice: (price: string) => void;
  setStopLossPrice: (price: string) => void;
  setPreview: (preview: OrderPreview | null) => void;
  toggleTpSl: () => void;
  reset: () => void;
}

const initialState: TradeState = {
  side: Side.Long,
  sizeUsdc: "",
  leverage: 5,
  takeProfitPrice: "",
  stopLossPrice: "",
  preview: null,
  showTpSl: false,
};

export const useTradeStore = create<TradeState & TradeActions>((set) => ({
  ...initialState,

  setSide: (side) => set({ side, preview: null }),
  setSize: (sizeUsdc) => set({ sizeUsdc, preview: null }),
  setLeverage: (leverage) => set({ leverage, preview: null }),
  setTakeProfitPrice: (takeProfitPrice) => set({ takeProfitPrice }),
  setStopLossPrice: (stopLossPrice) => set({ stopLossPrice }),
  setPreview: (preview) => set({ preview }),
  toggleTpSl: () => set((s) => ({ showTpSl: !s.showTpSl })),
  reset: () => set(initialState),
}));
