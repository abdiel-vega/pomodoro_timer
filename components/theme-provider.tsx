"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Custom context for theme variant
interface ThemeContextType {
  themeVariant: string;
  setThemeVariant: (variant: string) => void;
}

const ThemeVariantContext = React.createContext<ThemeContextType>({
  themeVariant: '',
  setThemeVariant: () => {},
});

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [themeVariant, setThemeVariant] = React.useState<string>('');

  // Load the saved theme variant on component mount
  React.useEffect(() => {
    // Only run in the browser
    if (typeof window !== 'undefined') {
      const savedVariant = localStorage.getItem('themeVariant') || '';
      if (savedVariant) {
        setThemeVariant(savedVariant);
        document.documentElement.setAttribute('data-theme', savedVariant);
      }
    }
  }, []);

  // Function to update theme variant
  const handleSetThemeVariant = React.useCallback((variant: string) => {
    setThemeVariant(variant);
    localStorage.setItem('themeVariant', variant);
    document.documentElement.setAttribute('data-theme', variant);
  }, []);

  return (
    <ThemeVariantContext.Provider value={{ themeVariant, setThemeVariant: handleSetThemeVariant }}>
      <NextThemesProvider 
        attribute="class" 
        defaultTheme="light" 
        enableSystem={false} 
        disableTransitionOnChange
        {...props}
      >
        {children}
      </NextThemesProvider>
    </ThemeVariantContext.Provider>
  )
}

// Custom hook to access theme variant
export function useThemeVariant() {
  const context = React.useContext(ThemeVariantContext);
  if (context === undefined) {
    throw new Error('useThemeVariant must be used within a ThemeProvider');
  }
  return context;
}