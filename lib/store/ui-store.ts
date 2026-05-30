import { create } from "zustand";

export type Theme = "light" | "dark";
export type PreviewFormat = "sql" | "mongo" | "json";

interface UIState {
  theme: Theme;
  previewFormat: PreviewFormat;
  resultsVisible: boolean;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setPreviewFormat: (format: PreviewFormat) => void;
  toggleResults: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: "light",
  previewFormat: "sql",
  resultsVisible: false,

  setTheme: (theme) => {
    // The theme is expressed as a data attribute the CSS variables key off of.
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("vantage-theme", theme);
    }
    set({ theme });
  },

  toggleTheme: () => get().setTheme(get().theme === "light" ? "dark" : "light"),

  setPreviewFormat: (previewFormat) => set({ previewFormat }),

  toggleResults: () => set((s) => ({ resultsVisible: !s.resultsVisible })),
}));
