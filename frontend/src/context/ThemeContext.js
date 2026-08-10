import React, { createContext, useContext, useState } from "react";

export const themesList = [
  {
    id: "Night",
    name: "Night",
    subtitle: "Deep Midnight Dark Mode (Default)",
    icon: "moon",
    primary: "#6366F1",
    primaryDark: "#A78BFA",
    bg: "#0B0F19",
    cardBg: "#111625",
    text: "#F8FAFC",
    subtext: "#94A3B8",
    border: "#1E263B",
    badgeBg: "#1E1B4B",
    inputBg: "#131927",
    isDark: true
  },
  {
    id: "Day",
    name: "Day",
    subtitle: "Classic Light Daylight",
    icon: "sun",
    primary: "#5B3CF5",
    primaryDark: "#261B94",
    bg: "#F8FAFC",
    cardBg: "#FFFFFF",
    text: "#0F172A",
    subtext: "#64748B",
    border: "#F0EFFF",
    badgeBg: "#F0EDFF",
    inputBg: "#FFFFFF",
    isDark: false
  },
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
    inputBg: "#FFFFFF",
    isDark: false
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
    inputBg: "#FFFFFF",
    isDark: false
  }
];

const ThemeContext = createContext({
  currentTheme: "Night",
  theme: themesList[0],
  changeTheme: () => {},
  themesList
});

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState("Night");

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
