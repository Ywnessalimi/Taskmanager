export type Theme = "light" | "dark" | "system"

export const THEME_COOKIE = "theme"
export const THEMES: Theme[] = ["light", "dark", "system"]
export const DEFAULT_THEME: Theme = "system"

export function parseTheme(value: string | undefined): Theme {
  return value === "light" || value === "dark" ? value : DEFAULT_THEME
}
