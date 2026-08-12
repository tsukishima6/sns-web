"use client";

import { createContext, useContext, useCallback, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "kaiwai-theme";

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyResolvedTheme(resolved) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }) {
  // theme: ユーザーが選んだ設定（"light" | "dark" | "system"）
  // resolvedTheme: 実際に画面に適用されている見た目（"light" | "dark"）
  const [theme, setThemeState] = useState("system");
  const [resolvedTheme, setResolvedTheme] = useState("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setThemeState(stored === "light" || stored === "dark" ? stored : "system");
  }, []);

  useEffect(() => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
    applyResolvedTheme(resolved);

    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = getSystemTheme();
      setResolvedTheme(next);
      applyResolvedTheme(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    if (next === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
