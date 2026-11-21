import { useSyncExternalStore } from "react";

// Light/dark: the "dark" class on <html> (set before first paint by index.html), a saved choice in
// localStorage, else the OS setting, which is followed live until the person picks one.
export type Theme = "light" | "dark";
const KEY = "theme";
const os = matchMedia("(prefers-color-scheme: dark)");

const current = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");
const apply = (t: Theme) => document.documentElement.classList.toggle("dark", t === "dark");
const saved = (): string | null => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null; // private mode: just follow the OS
  }
};

os.addEventListener("change", (e) => saved() || apply(e.matches ? "dark" : "light"));

function subscribe(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current);
  const setTheme = (t: Theme) => {
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* not remembered, still applied */
    }
    apply(t);
  };
  return { theme, setTheme };
}
