import React, { createContext, useContext, useState } from "react";

export const themesList = [
  {
    id: "Nature",
    name: "Nature",
    subtitle: "Fresh Forest & Soft Mint Emerald (Default)",
    icon: "leaf",
    primary: "#0A6836",
    primaryDark: "#044324",
    primaryLight: "#DCFCE7",
    accent: "#0D7D3D",
    bg: "#F4F7F4",
    cardBg: "#FFFFFF",
    text: "#0F172A",
    subtext: "#475569",
    border: "#E2E8E2",
    badgeBg: "#E8F5E9",
    badgeText: "#0A6836",
    badgeBorder: "#C8E6C9",
    inputBg: "#FFFFFF",
    activeChipBg: "#0A6836",
    activeChipText: "#FFFFFF",
    inactiveChipBg: "#FFFFFF",
    inactiveChipText: "#1E293B",
    fabBg: "#0A6836",
    isDark: false
  },
  {
    id: "Night",
    name: "Night",
    subtitle: "Deep Midnight Dark Mode",
    icon: "moon",
    primary: "#10B981",
    primaryDark: "#059669",
    primaryLight: "#065F46",
    accent: "#34D399",
    bg: "#0B0F19",
    cardBg: "#111625",
    text: "#F8FAFC",
    subtext: "#94A3B8",
    border: "#1E263B",
    badgeBg: "#064E3B",
    badgeText: "#A7F3D0",
    badgeBorder: "#047857",
    inputBg: "#131927",
    activeChipBg: "#10B981",
    activeChipText: "#FFFFFF",
    inactiveChipBg: "#1E263B",
    inactiveChipText: "#94A3B8",
    fabBg: "#10B981",
    isDark: true
  },
  {
    id: "Day",
    name: "Day",
    subtitle: "Classic Daylight Nature",
    icon: "sun",
    primary: "#0A6836",
    primaryDark: "#044324",
    primaryLight: "#DCFCE7",
    accent: "#0D7D3D",
    bg: "#F8FAFC",
    cardBg: "#FFFFFF",
    text: "#0F172A",
    subtext: "#64748B",
    border: "#E2E8E2",
    badgeBg: "#E8F5E9",
    badgeText: "#0A6836",
    badgeBorder: "#C8E6C9",
    inputBg: "#FFFFFF",
    activeChipBg: "#0A6836",
    activeChipText: "#FFFFFF",
    inactiveChipBg: "#FFFFFF",
    inactiveChipText: "#1E293B",
    fabBg: "#0A6836",
    isDark: false
  },
  {
    id: "Lime",
    name: "Lime",
    subtitle: "Lime Green Accent Theme",
    icon: "zap",
    primary: "#84CC16",
    primaryDark: "#4D7C0F",
    primaryLight: "#ECFDF5",
    accent: "#65A30D",
    bg: "#F7FEE7",
    cardBg: "#FFFFFF",
    text: "#1A2E05",
    subtext: "#4D7C0F",
    border: "#D9F99D",
    badgeBg: "#ECFDF5",
    badgeText: "#4D7C0F",
    badgeBorder: "#BEF264",
    inputBg: "#FFFFFF",
    activeChipBg: "#84CC16",
    activeChipText: "#FFFFFF",
    inactiveChipBg: "#FFFFFF",
    inactiveChipText: "#1A2E05",
    fabBg: "#84CC16",
    isDark: false
  },
  {
    id: "Evening",
    name: "Evening",
    subtitle: "Warm Sunset Tones",
    icon: "sunset",
    primary: "#EA580C",
    primaryDark: "#9A3412",
    primaryLight: "#FFEDD5",
    accent: "#F97316",
    bg: "#FFF7ED",
    cardBg: "#FFFFFF",
    text: "#431407",
    subtext: "#9A3412",
    border: "#FFEDD5",
    badgeBg: "#FFEDD5",
    badgeText: "#EA580C",
    badgeBorder: "#FDBA74",
    inputBg: "#FFFFFF",
    activeChipBg: "#EA580C",
    activeChipText: "#FFFFFF",
    inactiveChipBg: "#FFFFFF",
    inactiveChipText: "#431407",
    fabBg: "#EA580C",
    isDark: false
  }
];

const ThemeContext = createContext({
  currentTheme: "Nature",
  theme: themesList[0],
  changeTheme: () => {},
  themesList
});

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState("Nature");

  const activeTheme = themesList.find((t) => t.id === currentTheme) || themesList[0];

  function changeTheme(themeId) {
    if (themesList.some((t) => t.id === themeId)) {
      setCurrentTheme(themeId);
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        theme: activeTheme,
        changeTheme,
        themesList
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

