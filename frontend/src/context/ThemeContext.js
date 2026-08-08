import React, { createContext, useContext, useState } from "react";

export const themesList = [
  {
    id: "Lime",
    name: "Lime",
    subtitle: "Lime Green Accent Theme",
    icon: "zap",
    primary: "#84CC16",
    primaryDark: "#4D7C0F",
    bg: "#F7FEE7",
    cardBg: "#FFFFFF",
    text: "#1A2E05",
    subtext: "#4D7C0F",
    border: "#D9F99D",
    badgeBg: "#ECFDF5",
    isDark: false
  },
  {
    id: "Day",
    name: "Day",
    subtitle: "Classic Light & Crisp Daylight (Default)",
    icon: "sun",
    primary: "#5B3CF5",
    primaryDark: "#261B94",
    bg: "#F8FAFC",
    cardBg: "#FFFFFF",
    text: "#0F172A",
    subtext: "#64748B",
    border: "#F0EFFF",
    badgeBg: "#F0EDFF",
    isDark: false
  },
  {
    id: "Night",
    name: "Night",
    subtitle: "Deep Midnight Dark Mode",
    icon: "moon",
    primary: "#6366F1",
    primaryDark: "#4338CA",
    bg: "#0F172A",
    cardBg: "#1E293B",
    text: "#F8FAFC",
    subtext: "#94A3B8",
    border: "#334155",
    badgeBg: "#1E1B4B",
    isDark: true
  },
  {
    id: "Evening",
    name: "Evening",
    subtitle: "Warm Sunset Tones",
    icon: "sunset",
    primary: "#EA580C",
    primaryDark: "#9A3412",
    bg: "#FFF7ED",
    cardBg: "#FFFFFF",
    text: "#431407",
    subtext: "#9A3412",
    border: "#FFEDD5",
    badgeBg: "#FFEDD5",
    isDark: false
  }
];

const ThemeContext = createContext({
  currentTheme: "Day",
  theme: themesList[1],
  changeTheme: () => {},
  themesList
});

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState("Day");

  const activeTheme = themesList.find((t) => t.id === currentTheme) || themesList[1];

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
