/**
 * Theme utility for Deccan Space Works
 * Handles localStorage persistence and initial theme detection.
 * Themes: "dark" (default) | "light"
 */

export const THEME_KEY = "dsw-theme";
export const THEMES = { DARK: "dark", LIGHT: "light" };

/**
 * Returns the user's saved theme, or "dark" as the default.
 * Safe to call only in browser context.
 */
export function getStoredTheme() {
  if (typeof window === "undefined") return THEMES.DARK;
  return localStorage.getItem(THEME_KEY) || THEMES.DARK;
}

/**
 * Persists the selected theme and applies it to the document root.
 */
export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

/**
 * Inline script string to inject into <head> BEFORE React hydration
 * to prevent flash of unstyled content (FOUC).
 * Must be a raw string – injected via dangerouslySetInnerHTML.
 */
export const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('dsw-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;
