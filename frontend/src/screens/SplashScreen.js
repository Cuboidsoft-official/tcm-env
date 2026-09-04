import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View, Image, Animated, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../constants/fonts";

const logoImg = require("../../assets/icon.png");

export default function SplashScreen() {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 35,
        useNativeDriver: true
      })
    ]).start();

    // Soft pulse for AI badge icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <Animated.View style={[styles.centerContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        
        {/* App Logo with Minimalist Ring */}
        <View style={styles.logoRingWrapper}>
          <View style={[styles.logoOuterRing, { borderColor: theme.isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)" }]} />
          <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />
        </View>

        {/* Crisp Solid Brand Title */}
        <View style={styles.brandTitleRow}>
          <Text style={[styles.brandTitle, { color: theme.text }]}>TCM </Text>
          <Text style={[styles.brandTitleAccent, { color: theme.isDark ? "#FFFFFF" : "#000000" }]}>One</Text>
        </View>

        {/* Subtitle Divider Row */}
        <View style={styles.subtitleRow}>
          <View style={[styles.accentLine, { backgroundColor: theme.isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)" }]} />
          <Text style={[styles.subTitle, { color: theme.subtext }]}>Decoding The Mind</Text>
          <View style={[styles.accentLine, { backgroundColor: theme.isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)" }]} />
        </View>

        {/* Lappy AI Badge */}
        <View style={[styles.aiBadge, { backgroundColor: theme.isDark ? "#18181B" : "#F4F4F5", borderColor: theme.border }]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons name="sparkles" size={14} color={theme.isDark ? "#E4E4E7" : "#18181B"} />
          </Animated.View>
          <Text style={[styles.aiBadgeText, { color: theme.text }]}>
            Powered by <Text style={styles.aiBadgeHighlight}>Lappy AI</Text> & Mentors
          </Text>
        </View>

        {/* Slogan Pill Card */}
        <View style={[styles.sloganCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="shield-check" size={15} color={theme.text} style={{ marginRight: 6 }} />
          <Text style={[styles.sloganText, { color: theme.text }]} numberOfLines={1}>
            "Hum wada wahi karte hain jo hum nibha paayein."
          </Text>
        </View>

        {/* Sleek Loader Indicator */}
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={theme.text} />
          <Text style={[styles.loadingText, { color: theme.subtext }]}>Launching AI Workspace...</Text>
        </View>

      </Animated.View>

      {/* Made for India Footer Badge */}
      <View style={styles.footerBadgeRow}>
        <Text style={styles.indiaFlagEmoji}>🇮🇳</Text>
        <Text style={[styles.footerBadgeText, { color: theme.subtext }]}>
          Made with Pride for India's Tech Leaders
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between"
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16
  },
  logoRingWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20
  },
  logoOuterRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 30,
    borderWidth: 1.5
  },
  logoImage: {
    width: 82,
    height: 82,
    borderRadius: 24
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4
  },
  brandTitle: {
    fontFamily: fonts.bold,
    fontSize: 34,
    letterSpacing: -0.5
  },
  brandTitleAccent: {
    fontFamily: fonts.bold,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.5
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20
  },
  accentLine: {
    height: 1,
    width: 18
  },
  subTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    letterSpacing: 1.8,
    textTransform: "uppercase"
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16
  },
  aiBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 12
  },
  aiBadgeHighlight: {
    fontFamily: fonts.bold
  },
  sloganCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
    maxWidth: "96%",
    alignSelf: "center"
  },
  sloganText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    textAlign: "center"
  },
  loaderWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 12
  },
  footerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 20,
    paddingTop: 8,
    gap: 6
  },
  indiaFlagEmoji: {
    fontSize: 14
  },
  footerBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 11
  }
});
