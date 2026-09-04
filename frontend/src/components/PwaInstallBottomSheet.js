import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Image,
  ActivityIndicator
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../constants/fonts";

const DISMISS_KEY = "tcm_pwa_bottomsheet_dismissed_v1";

export default function PwaInstallBottomSheet({ visible: propVisible, onClose, onShowToast }) {
  const { theme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    // Check if already in standalone (installed) mode
    const standaloneCheck =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://");

    if (standaloneCheck) {
      setIsStandalone(true);
      return;
    }

    // Check existing global prompt if captured early
    if (window.deferredPwaPrompt) {
      setDeferredPrompt(window.deferredPwaPrompt);
    }

    const handlePromptCaptured = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.onPwaPromptCaptured = handlePromptCaptured;
    if (typeof window.addEventListener === "function") {
      window.addEventListener("beforeinstallprompt", handlePromptCaptured);
    }

    // Auto show after 2.5s if not dismissed in last 24h
    async function checkAutoShow() {
      try {
        const lastDismissed = await AsyncStorage.getItem(DISMISS_KEY);
        if (lastDismissed) {
          const past = parseInt(lastDismissed, 10);
          // If dismissed less than 24 hours ago, don't auto show
          if (Date.now() - past < 24 * 60 * 60 * 1000) {
            return;
          }
        }
      } catch (err) {}

      setTimeout(() => {
        setVisible(true);
      }, 2500);
    }

    checkAutoShow();

    return () => {
      if (typeof window !== "undefined" && typeof window.removeEventListener === "function") {
        window.removeEventListener("beforeinstallprompt", handlePromptCaptured);
      }
    };
  }, []);

  // Sync visible state if parent controls it
  useEffect(() => {
    if (propVisible !== undefined) {
      setVisible(propVisible);
    }
  }, [propVisible]);

  const handleDismiss = async () => {
    setVisible(false);
    if (onClose) onClose();
    try {
      await AsyncStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch (e) {}
  };

  const handleInstallClick = async () => {
    setIsInstalling(true);

    const activePrompt = deferredPrompt || window.deferredPwaPrompt;

    if (activePrompt && typeof activePrompt.prompt === "function") {
      try {
        activePrompt.prompt();
        const choiceResult = await activePrompt.userChoice;
        if (choiceResult && choiceResult.outcome === "accepted") {
          console.log("[PWA] User accepted the install prompt");
          if (onShowToast) {
            onShowToast({
              type: "success",
              title: "App Installed 🎉",
              subtitle: "Last Class app added to your Home Screen!"
            });
          }
          setVisible(false);
          if (onClose) onClose();
        } else {
          console.log("[PWA] User dismissed the install prompt");
        }
        setDeferredPrompt(null);
        window.deferredPwaPrompt = null;
      } catch (err) {
        console.warn("[PWA] Prompt error:", err);
        setShowInstructions(true);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Prompt not available or iOS Safari -> show visual step-by-step guide
      setIsInstalling(false);
      setShowInstructions(true);
    }
  };

  if (isStandalone) return null;

  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent || "") &&
    !window.MSStream;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.overlay} onPress={handleDismiss}>
        <Pressable
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.isDark ? "#1E293B" : "#FFFFFF",
              borderColor: theme.isDark ? "#334155" : "#E2E8F0"
            }
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handleBar,
                { backgroundColor: theme.isDark ? "#475569" : "#CBD5E1" }
              ]}
            />
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={handleDismiss}
            activeOpacity={0.7}
            style={[
              styles.closeBtn,
              { backgroundColor: theme.isDark ? "#334155" : "#F1F5F9" }
            ]}
          >
            <Feather name="x" size={18} color={theme.text} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* App Header Badge */}
            <View style={styles.headerSection}>
              <View style={styles.appIconWrapper}>
                <Image
                  source={require("../../assets/icon.png")}
                  style={styles.headerLogoImage}
                  resizeMode="contain"
                />
                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={16} color="#10B981" />
                </View>
              </View>

              <View style={styles.headerInfo}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.appTitle, { color: theme.text }]}>TCM One</Text>
                  <View style={[styles.pwaTag, { backgroundColor: theme.primary }]}>
                    <Text style={styles.pwaTagText}>PWA APP</Text>
                  </View>
                </View>

                <Text style={[styles.appSubtitle, { color: theme.subtext }]}>
                  The Code Munk • Official Web App
                </Text>

                <View style={styles.ratingRow}>
                  <View style={styles.starsRow}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.ratingText}>4.9</Text>
                  </View>
                  <Text style={styles.ratingDot}>•</Text>
                  <Text style={[styles.ratingMeta, { color: theme.subtext }]}>
                    Instant Install • &lt; 1MB
                  </Text>
                </View>
              </View>
            </View>

            {/* Highlights Grid */}
            <View style={[styles.highlightsContainer, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC" }]}>
              <View style={styles.highlightItem}>
                <View style={[styles.highlightIcon, { backgroundColor: theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(10, 104, 54, 0.12)" }]}>
                  <ZapIcon color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.highlightTitle, { color: theme.text }]}>1-Tap Home Screen</Text>
                  <Text style={[styles.highlightSub, { color: theme.subtext }]}>
                    Open like a native app right from home screen
                  </Text>
                </View>
              </View>

              <View style={styles.highlightItem}>
                <View style={[styles.highlightIcon, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                  <Feather name="bell" size={16} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.highlightTitle, { color: theme.text }]}>Instant Push Alerts</Text>
                  <Text style={[styles.highlightSub, { color: theme.subtext }]}>
                    Get real-time job updates & community alerts
                  </Text>
                </View>
              </View>

              <View style={styles.highlightItem}>
                <View style={[styles.highlightIcon, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
                  <Feather name="wifi-off" size={16} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.highlightTitle, { color: theme.text }]}>Super Fast & Offline</Text>
                  <Text style={[styles.highlightSub, { color: theme.subtext }]}>
                    Loads instantly even on slow 3G networks
                  </Text>
                </View>
              </View>
            </View>

            {/* Step-by-Step Instructions Card (Show if prompt not directly executable) */}
            {showInstructions && (
              <View style={[styles.instructionCard, { backgroundColor: theme.isDark ? "#064E3B" : "#ECFDF5", borderColor: theme.primary }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Feather name="info" size={18} color={theme.primary} />
                  <Text style={[styles.instructionHeader, { color: theme.isDark ? "#E0E7FF" : theme.primaryDark }]}>
                    How to Install on {isIOS ? "iOS Safari" : "Your Browser"}:
                  </Text>
                </View>

                {isIOS ? (
                  <View style={styles.stepList}>
                    <Text style={[styles.stepText, { color: theme.isDark ? "#A7F3D0" : theme.primaryDark }]}>
                      1. Tap the <Text style={{ fontFamily: fonts.bold }}>Share</Text> button in Safari footer (<Feather name="share" size={14} color={theme.primary} />).
                    </Text>
                    <Text style={[styles.stepText, { color: theme.isDark ? "#A7F3D0" : theme.primaryDark }]}>
                      2. Scroll down and tap <Text style={{ fontFamily: fonts.bold }}>'Add to Home Screen'</Text> (<Feather name="plus-square" size={14} color={theme.primary} />).
                    </Text>
                    <Text style={[styles.stepText, { color: theme.isDark ? "#A7F3D0" : theme.primaryDark }]}>
                      3. Tap <Text style={{ fontFamily: fonts.bold }}>'Add'</Text> at top right to complete.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.stepList}>
                    <Text style={[styles.stepText, { color: theme.isDark ? "#A7F3D0" : theme.primaryDark }]}>
                      1. Tap browser menu (<Feather name="more-vertical" size={14} color={theme.primary} />) top right.
                    </Text>
                    <Text style={[styles.stepText, { color: theme.isDark ? "#A7F3D0" : theme.primaryDark }]}>
                      2. Select <Text style={{ fontFamily: fonts.bold }}>'Install App'</Text> or <Text style={{ fontFamily: fonts.bold }}>'Add to Home screen'</Text>.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsGroup}>
              <TouchableOpacity
                onPress={handleInstallClick}
                activeOpacity={0.85}
                disabled={isInstalling}
                style={styles.installBtnTouchable}
              >
                <LinearGradient
                  colors={[theme.primary, theme.accent || theme.primaryDark || theme.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.installGradientBtn}
                >
                  {isInstalling ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="download" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.installBtnText}>
                        {showInstructions ? "Got It!" : "Install App Now"}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDismiss}
                activeOpacity={0.7}
                style={[
                  styles.dismissBtn,
                  { borderColor: theme.isDark ? "#334155" : "#E2E8F0" }
                ]}
              >
                <Text style={[styles.dismissBtnText, { color: theme.subtext }]}>Not Now</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ZapIcon({ color = "#0A6836" }) {
  return <Feather name="zap" size={16} color={color} />;
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end"
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    maxHeight: "85%",
    borderWidth: 1,
    position: "relative"
  },
  handleContainer: {
    alignItems: "center",
    marginBottom: 12
  },
  handleBar: {
    width: 42,
    height: 5,
    borderRadius: 3
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10
  },
  scrollContent: {
    paddingBottom: 8
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingRight: 32
  },
  appIconWrapper: {
    position: "relative",
    marginRight: 14
  },
  headerLogoImage: {
    width: 56,
    height: 56,
    borderRadius: 14
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#FFFFFF",
    borderRadius: 10
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center"
  },
  appTitle: {
    fontFamily: fonts.bold,
    fontSize: 18
  },
  pwaTag: {
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  pwaTagText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: fonts.bold
  },
  appSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 1
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },
  ratingText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#F59E0B"
  },
  ratingDot: {
    fontSize: 12,
    color: "#94A3B8"
  },
  ratingMeta: {
    fontFamily: fonts.medium,
    fontSize: 11
  },
  highlightsContainer: {
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 16
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  highlightIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  highlightTitle: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  highlightSub: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 1
  },
  instructionCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16
  },
  instructionHeader: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  stepList: {
    gap: 6
  },
  stepText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18
  },
  actionsGroup: {
    gap: 10,
    marginTop: 4
  },
  installBtnTouchable: {
    borderRadius: 14,
    overflow: "hidden"
  },
  installGradientBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14
  },
  installBtnText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#FFFFFF"
  },
  dismissBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1
  },
  dismissBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14
  }
});
