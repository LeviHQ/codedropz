import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Mode = "dark" | "light";
export type Accent = "blue" | "purple" | "green" | "orange" | "pink" | "red" | "cyan";

export const ACCENTS: { id: Accent; label: string; swatch: string }[] = [
  { id: "blue", label: "Blue", swatch: "oklch(0.68 0.18 250)" },
  { id: "purple", label: "Purple", swatch: "oklch(0.66 0.22 300)" },
  { id: "green", label: "Green", swatch: "oklch(0.72 0.17 155)" },
  { id: "orange", label: "Orange", swatch: "oklch(0.74 0.17 55)" },
  { id: "pink", label: "Pink", swatch: "oklch(0.72 0.20 355)" },
  { id: "red", label: "Red", swatch: "oklch(0.66 0.22 25)" },
  { id: "cyan", label: "Cyan", swatch: "oklch(0.78 0.13 210)" },
];

type Ctx = {
  mode: Mode;
  accent: Accent;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
  setAccent: (a: Accent) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("dark");
  const [accent, setAccentState] = useState<Accent>("orange");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const m = localStorage.getItem("cd:mode") as Mode | null;
      const a = localStorage.getItem("cd:accent") as Accent | null;
      if (m === "light" || m === "dark") setModeState(m);
      if (a) setAccentState(a);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.classList.toggle("light", mode === "light");
    root.classList.toggle("dark", mode === "dark");
    root.dataset.accent = accent;
    root.style.colorScheme = mode;
    try {
      localStorage.setItem("cd:mode", mode);
      localStorage.setItem("cd:accent", accent);
    } catch {}
  }, [mode, accent, ready]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        accent,
        setMode: setModeState,
        toggleMode: () => setModeState((m) => (m === "dark" ? "light" : "dark")),
        setAccent: setAccentState,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}