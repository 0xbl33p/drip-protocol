import { create } from "zustand";

interface UiState {
  isMobileMenuOpen: boolean;
  chartTimeframe: string;
  feedFilter: string;
  terminalLayout: "default" | "chart-focus" | "trade-focus";
}

interface UiActions {
  setMobileMenuOpen: (open: boolean) => void;
  setChartTimeframe: (tf: string) => void;
  setFeedFilter: (filter: string) => void;
  setTerminalLayout: (layout: UiState["terminalLayout"]) => void;
}

export const useUiStore = create<UiState & UiActions>((set) => ({
  isMobileMenuOpen: false,
  chartTimeframe: "1h",
  feedFilter: "all",
  terminalLayout: "default",

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  setChartTimeframe: (tf) => set({ chartTimeframe: tf }),
  setFeedFilter: (filter) => set({ feedFilter: filter }),
  setTerminalLayout: (layout) => set({ terminalLayout: layout }),
}));
