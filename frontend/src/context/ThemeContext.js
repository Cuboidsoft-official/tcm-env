import React, { createContext, useContext, useState } from "react";

export const themesList = [
  {
    id: "Nature",
    name: "Nature",
    subtitle: "Clean Black & White Studio (Default)",
    icon: "leaf",
    primary: "#0F172A",
    primaryDark: "#000000",
    primaryLight: "#F1F5F9",
    accent: "#000000",
    bg: "#FFFFFF",
    cardBg: "#FFFFFF",
    text: "#0F172A",
    subtext: "#64748B",
    border: "#E2E8F0",
    badgeBg: "#F1F5F9",
    badgeText: "#0F172A",
    badgeBorder: "#CBD5E1",
    inputBg: "#FFFFFF",
    activeChipBg: "#0F172A",
    activeChipText: "#FFFFFF",
    inactiveChipBg: "#FFFFFF",
    inactiveChipText: "#0F172A",
    fabBg: "#0F172A",
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
    subtitle: "Classic Daylight Black & White",
    icon: "sun",
    primary: "#0F172A",
    primaryDark: "#000000",
    primaryLight: "#F1F5F9",
    accent: "#000000",
    bg: "#FFFFFF",
    cardBg: "#FFFFFF",
    text: "#0F172A",
    subtext: "#64748B",
    border: "#E2E8F0",
    badgeBg: "#F1F5F9",
    badgeText: "#0F172A",
    badgeBorder: "#CBD5E1",
    inputBg: "#FFFFFF",
    activeChipBg: "#0F172A",
    activeChipText: "#FFFFFF",
    inactiveChipBg: "#FFFFFF",
    inactiveChipText: "#0F172A",
    fabBg: "#0F172A",
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
  currentTheme: "Day",
  theme: themesList[2],
  changeTheme: () => {},
  themesList
});

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState("Day");

  const activeTheme = themesList.find((t) => t.id === currentTheme) || themesList[2];

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

