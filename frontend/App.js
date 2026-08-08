import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  useFonts
} from "@expo-google-fonts/poppins";
import LoginScreen from "./src/screens/LoginScreen";
import SplashScreen from "./src/screens/SplashScreen";
import HomeScreen from "./src/screens/HomeScreen";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { setupPushNotifications } from "./src/services/notificationService";

function AppContent() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold
  });
  const [screen, setScreen] = useState("splash");
  const [session, setSession] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setScreen("login"), 1900);
    return () => clearTimeout(timer);
  }, []);

  function handleLogin(nextSession) {
    setSession(nextSession);
    setScreen("home");
    if (nextSession?.token) {
      setupPushNotifications(nextSession.token);
    }
  }

  function handleLogout() {
    setSession(null);
    setScreen("login");
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: theme.bg }}>
      <StatusBar style={theme.isDark ? "light" : "dark"} backgroundColor={theme.bg} />
      {(!fontsLoaded || screen === "splash") && <SplashScreen />}
      {fontsLoaded && screen === "login" && <LoginScreen onLogin={handleLogin} />}
      {fontsLoaded && screen === "home" && (
        <HomeScreen session={{ ...session, onLogout: handleLogout }} onLogout={handleLogout} />
      )}
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
