import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const STORAGE_SESSION_KEY = "tcm_user_session_v1";

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
    let isMounted = true;
    async function restorePersistentSession() {
      try {
        const storedSessionJson = await AsyncStorage.getItem(STORAGE_SESSION_KEY);
        if (storedSessionJson) {
          const parsedSession = JSON.parse(storedSessionJson);
          if (parsedSession && (parsedSession.token || parsedSession.user)) {
            if (isMounted) {
              setSession(parsedSession);
              setScreen("home");
              if (parsedSession.token) {
                setupPushNotifications(parsedSession.token);
              }
              return;
            }
          }
        }
      } catch (err) {
        console.log("Failed to restore session from AsyncStorage:", err);
      }
      if (isMounted) {
        setScreen("home");
      }
    }

    const timer = setTimeout(() => {
      restorePersistentSession();
    }, 1800);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  async function handleLogin(nextSession) {
    setSession(nextSession);
    setScreen("home");
    try {
      if (nextSession) {
        await AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(nextSession));
      }
    } catch (err) {
      console.log("Failed to save session to AsyncStorage:", err);
    }
    if (nextSession?.token) {
      setupPushNotifications(nextSession.token);
    }
  }

  async function handleLogout() {
    setSession(null);
    setScreen("home");
    try {
      await AsyncStorage.removeItem(STORAGE_SESSION_KEY);
    } catch (err) {
      console.log("Failed to remove session from AsyncStorage:", err);
    }
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: theme.bg }}>
      <StatusBar style={theme.isDark ? "light" : "dark"} backgroundColor={theme.bg} />
      {(!fontsLoaded || screen === "splash") && <SplashScreen />}
      {fontsLoaded && screen === "login" && (
        <LoginScreen onLogin={handleLogin} onCancelGuest={() => setScreen("home")} />
      )}
      {fontsLoaded && screen === "home" && (
        <HomeScreen
          session={{ ...session, onLogout: handleLogout }}
          onLogout={handleLogout}
          onRequireLogin={() => setScreen("login")}
        />
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
