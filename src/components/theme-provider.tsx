"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  systemTheme: Theme
  themes: Theme[]
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme)
  const [mounted, setMounted] = React.useState(false)
  const [systemTheme, setSystemTheme] = React.useState<Theme>("light")

  // Mount & detect stored theme
  React.useEffect(() => {
    setMounted(true)

    const storedTheme = localStorage.getItem(storageKey) as Theme | null
    if (storedTheme) {
      setTheme(storedTheme)
    }

    // Detect system theme
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light")
    }
    handleChange()
    mediaQuery.addEventListener("change", handleChange)

    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [storageKey])

  // Update DOM & localStorage when theme changes
  React.useEffect(() => {
    const root = window.document.documentElement
    const appliedTheme = theme === "system" ? systemTheme : theme

    root.setAttribute("data-theme", appliedTheme)
    root.classList.toggle("dark", appliedTheme === "dark")
    localStorage.setItem(storageKey, theme)
  }, [theme, systemTheme, storageKey])

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      systemTheme,
      themes: ["light", "dark", "system"] as Theme[],
    }),
    [theme, systemTheme]
  )

  if (!mounted) return null

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within a ThemeProvider")
  return context
}
