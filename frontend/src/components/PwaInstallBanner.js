import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { fonts } from "../constants/fonts";

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    // Check if already in standalone (installed) mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show prompt on web if not installed after 3s
    const timer = setTimeout(() => {
      setVisible(true);
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  async function handleInstallPress() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the PWA install prompt");
      }
      setDeferredPrompt(null);
      setVisible(false);
    } else {
      // Fallback instructions for browsers that don't support beforeinstallprompt (e.g. iOS Safari)
      alert("To install TCM Web App on your home screen:\n\n1. Tap the Share button in Safari / Chrome\n2. Select 'Add to Home Screen' 📱");
      setVisible(false);
    }
  }

  if (!visible || Platform.OS !== "web") return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A6836", "#044421"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bannerContent}
      >
        <View style={styles.leftCol}>
          <View style={styles.appIconBadge}>
            <Ionicons name="phone-portrait-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Install TCM App 📱</Text>
            <Text style={styles.bannerSub} numberOfLines={1}>
              Add to home screen for 1-tap access & push alerts
            </Text>
          </View>
        </View>

        <View style={styles.rightCol}>
          <Pressable onPress={handleInstallPress} style={styles.installBtn}>
            <Text style={styles.installBtnText}>Install</Text>
          </Pressable>

          <Pressable onPress={() => setVisible(false)} style={styles.closeBtn} hitSlop={10}>
            <Feather name="x" size={18} color="rgba(255, 255, 255, 0.8)" />
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 10,
    left: 12,
    right: 12,
    zIndex: 9999,
    maxWidth: 600,
    alignSelf: "center"
  },
  bannerContent: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10
  },
  leftCol: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
    gap: 10
  },
  appIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  bannerTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: "#FFFFFF"
  },
  bannerSub: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 1
  },
  rightCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  installBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10
  },
  installBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#0A6836"
  },
  closeBtn: {
    padding: 4
  }
});
