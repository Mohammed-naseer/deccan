"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getStoredTheme, applyTheme, THEMES } from "@/lib/theme";

const ThemeContext = createContext({
  theme: THEMES.DARK,
  toggleTheme: () => {},
  isDark: true,
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(THEMES.DARK);

  // Sync with localStorage on mount (client only)
  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const toggleTheme = () => {
    const next = theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setTheme(next);
    applyTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === THEMES.DARK }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
