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

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold
  });
  const [screen, setScreen] = useState("splash");
  const [session, setSession] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setScreen("login"), 1900);
    return () => clearTimeout(timer);
  }, []);

  function handleLogin(nextSession) {
    setSession(nextSession);
    setScreen("home");
  }

  function handleLogout() {
    setSession(null);
    setScreen("login");
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={screen === "home" ? "dark" : "dark"} />
      {(!fontsLoaded || screen === "splash") && <SplashScreen />}
      {fontsLoaded && screen === "login" && <LoginScreen onLogin={handleLogin} />}
      {fontsLoaded && screen === "home" && (
        <HomeScreen session={{ ...session, onLogout: handleLogout }} onLogout={handleLogout} />
      )}
    </SafeAreaProvider>
  );
}
