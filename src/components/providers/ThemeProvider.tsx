'use client'

interface ThemeProviderProps {
  children: React.ReactNode
  nonce?: string
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>
}
