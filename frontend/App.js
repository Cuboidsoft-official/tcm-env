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
import { getProfile } from "./src/api/client";
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
  const [session, setSession] = useState(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.token || parsed.user)) return parsed;
        }
      }
    } catch (e) {}
    return null;
  });

  const [screen, setScreen] = useState(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.token || parsed.user)) return "home";
        }
      }
    } catch (e) {}
    return "splash";
  });

  const { theme } = useTheme();

  useEffect(() => {
    let isMounted = true;
    async function restorePersistentSession() {
      try {
        let storedSessionJson = null;
        if (typeof window !== "undefined" && window.localStorage) {
          storedSessionJson = window.localStorage.getItem(STORAGE_SESSION_KEY);
        }
        if (!storedSessionJson) {
          storedSessionJson = await AsyncStorage.getItem(STORAGE_SESSION_KEY);
        }
        if (storedSessionJson) {
          const parsedSession = JSON.parse(storedSessionJson);
          if (parsedSession && (parsedSession.token || parsedSession.user)) {
            if (isMounted) {
              setSession(parsedSession);
              setScreen("home");
              if (parsedSession.token && typeof setupPushNotifications === "function") {
                setupPushNotifications(parsedSession.token).catch(() => {});
                // Fetch fresh user profile directly from MongoDB backend on reload
                getProfile(parsedSession.token)
                  .then((res) => {
                    if (res?.user && isMounted) {
                      const updatedSession = { ...parsedSession, user: res.user };
                      setSession(updatedSession);
                      const jsonStr = JSON.stringify(updatedSession);
                      AsyncStorage.setItem(STORAGE_SESSION_KEY, jsonStr).catch(() => {});
                      if (typeof window !== "undefined" && window.localStorage) {
                        window.localStorage.setItem(STORAGE_SESSION_KEY, jsonStr);
                      }
                    }
                  })
                  .catch((e) => {
                    console.log("Profile DB sync notice (session preserved):", e);
                  });
              }
              return;
            }
          }
        }
      } catch (err) {
        console.log("Failed to restore session from AsyncStorage:", err);
      }
      if (isMounted && !session) {
        setScreen("login");
      }
    }

    restorePersistentSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogin(nextSession) {
    setSession(nextSession);
    setScreen("home");
    try {
      if (nextSession) {
        const jsonStr = JSON.stringify(nextSession);
        await AsyncStorage.setItem(STORAGE_SESSION_KEY, jsonStr);
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(STORAGE_SESSION_KEY, jsonStr);
        }
      }
    } catch (err) {
      console.log("Failed to save session to AsyncStorage:", err);
    }
    if (nextSession?.token && typeof setupPushNotifications === "function") {
      setupPushNotifications(nextSession.token).catch(() => {});
    }
  }

  async function handleUserUpdate(updatedUser) {
    if (!updatedUser) return;
    setSession((prev) => {
      const nextSession = { ...(prev || {}), user: updatedUser };
      const jsonStr = JSON.stringify(nextSession);
      AsyncStorage.setItem(STORAGE_SESSION_KEY, jsonStr).catch(() => {});
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_SESSION_KEY, jsonStr);
      }
      return nextSession;
    });
  }

  async function handleLogout() {
    setSession(null);
    setScreen("login");
    try {
      await AsyncStorage.removeItem(STORAGE_SESSION_KEY);
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(STORAGE_SESSION_KEY);
      }
    } catch (err) {
      console.log("Failed to remove session from AsyncStorage:", err);
    }
  }

  return (
    <SafeAreaProvider style={{ flex: 1, width: "100%", height: "100%", minHeight: "100%", backgroundColor: theme.bg }}>
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
          onUserUpdate={handleUserUpdate}
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
