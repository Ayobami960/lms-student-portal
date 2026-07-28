import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "theme";

function getInitialTheme(): "light" | "dark" {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(getInitialTheme);

  // This is the piece that was missing: syncing state -> DOM class.
  // Every token in index.css is keyed off `.dark` on an ancestor element,
  // so without this, toggling state changes nothing visually.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", currentTheme === "dark");
    localStorage.setItem(STORAGE_KEY, currentTheme);
  }, [currentTheme]);

  const onToggleTheme = useCallback(() => {
    setCurrentTheme((t) => (t === "light" ? "dark" : "light"));
  }, []);

  return { currentTheme, onToggleTheme };
}