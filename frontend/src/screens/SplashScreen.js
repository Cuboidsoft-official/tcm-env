import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View, Image, Animated, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../constants/fonts";

const logoImg = require("../../assets/icon.png");

export default function SplashScreen() {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <Animated.View style={[styles.centerContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        
        {/* App Logo with Glowing Ring */}
        <View style={styles.logoRingWrapper}>
          <View style={[styles.logoOuterRing, { borderColor: theme.isDark ? "rgba(16, 185, 129, 0.25)" : "rgba(91, 60, 245, 0.15)" }]} />
          <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />
        </View>

        {/* Indian Flag Tricolor Brand Title */}
        <View style={styles.brandTitleRow}>
          <Text style={[styles.brandLetter, { color: "#FF9933" }]}>T</Text>
          <Text style={[styles.brandLetter, { color: theme.isDark ? "#FFFFFF" : "#000080" }]}>C</Text>
          <Text style={[styles.brandLetter, { color: "#138808" }]}>M</Text>
          <Text style={[styles.brandLetter, { color: theme.text }]}> </Text>
          <Text style={[styles.brandLetter, { color: "#FF9933" }]}>O</Text>
          <Text style={[styles.brandLetter, { color: theme.isDark ? "#FFFFFF" : theme.primary }]}>n</Text>
          <Text style={[styles.brandLetter, { color: "#138808" }]}>e</Text>
        </View>

        {/* Subtitle */}
        <Text style={[styles.subTitle, { color: theme.subtext }]}>Talent & Career Mission</Text>
        
        {/* Tagline */}
        <Text style={[styles.tagline, { color: theme.text }]}>
          Learn. Build. Achieve.{"\n"}Your <Text style={[styles.futureHighlight, { color: theme.primary }]}>Future</Text> Starts Here.
        </Text>

        {/* Slogan Pill Card */}
        <View style={[styles.sloganCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="shield-check-outline" size={15} color={theme.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.sloganText, { color: theme.text }]} numberOfLines={1}>
            "Hum wada wahi karte hain jo hum nibha paayein."
          </Text>
        </View>

        {/* Sleek Loader Indicator */}
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.subtext }]}>Launching AI Workspace & Mentors...</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  logoRingWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  logoOuterRing: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 28,
    borderWidth: 2
  },
  logoImage: {
    width: 76,
    height: 76,
    borderRadius: 20
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4
  },
  brandLetter: {
    fontFamily: fonts.bold,
    fontSize: 30,
    letterSpacing: -0.5
  },
  subTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12
  },
  tagline: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16
  },
  futureHighlight: {
    fontFamily: fonts.bold
  },
  sloganCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    maxWidth: "94%",
    alignSelf: "center"
  },
  sloganText: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    textAlign: "center"
  },
  loaderWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 11.5
  },
  footerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 16,
    paddingTop: 8,
    gap: 6
  },
  indiaFlagEmoji: {
    fontSize: 13
  },
  footerBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 10.5
  }
});
