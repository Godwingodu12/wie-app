"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Define theme types
type Theme = "dark" | "light";

interface ThemeStyles {
  background: string;
  sidebarBg: string;
  text: string;
  textSecondary: string;
  border: string;
  hoverBg: string;
  activeItemBg: string;
  activeItemText: string;
  activeIconFilter: string;
  divider: string;
  iconFilter: string;
  pillBg: string;
  cardBg: string;
  activeTabBg: string;
  indicatorColor: string;
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  themeStyles: ThemeStyles;
}

const themeStyles: Record<Theme, ThemeStyles> = {
  dark: {
    background: "#050505",
    sidebarBg: "#0C1014",
    text: "#FFFFFF",
    textSecondary: "#E5E7EB",
    border: "rgba(255, 255, 255, 0.05)",
    hoverBg: "rgba(255, 255, 255, 0.05)",
    activeItemBg: "#FFFFFF",
    activeItemText: "#000000",
    activeIconFilter: "brightness(0) invert(1)", // White
    divider: "rgba(255, 255, 255, 0.1)",

    iconFilter: "brightness(0) invert(1)", // Force White
    pillBg: "#1E1E1E",
    cardBg: "#131313",
    activeTabBg: "rgba(255, 255, 255, 0.08)",
    indicatorColor: "transparent",
  },
  light: {
    background: "#F3F4F6",
    sidebarBg: "#FFFFFF",
    text: "#1F2937",
    textSecondary: "#6B7280",
    border: "rgba(0, 0, 0, 0.05)",
    hoverBg: "rgba(0, 0, 0, 0.05)",
    activeItemBg: "#0C1014",
    activeItemText: "#FFFFFF",
    activeIconFilter: "brightness(0)", // Black
    divider: "rgba(0, 0, 0, 0.1)",

    iconFilter: "brightness(0)", // Force Black
    pillBg: "#E5E7EB",
    cardBg: "#FFFFFF",
    activeTabBg: "rgba(0, 0, 0, 0.06)",
    indicatorColor: "transparent",
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const storedTheme = localStorage.getItem("app-theme") as Theme;
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  // Apply theme to body
  useEffect(() => {
    const styles = themeStyles[theme];

    // Set Sidebar Text Variables for Hover States
    document.documentElement.style.setProperty('--theme-text-primary', styles.text);
    document.documentElement.style.setProperty('--theme-text-secondary', styles.textSecondary);

    // Also set body styles directly as backup/override
    document.body.style.backgroundColor = styles.background;
    document.body.style.color = styles.text;

    // Toggle dark class for Tailwind
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("app-theme", newTheme);
      return newTheme;
    });
  };

  const value = {
    theme,
    isDark: theme === "dark",
    toggleTheme,
    themeStyles: themeStyles[theme],
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};