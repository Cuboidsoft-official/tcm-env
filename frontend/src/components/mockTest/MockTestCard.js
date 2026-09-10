import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../constants/fonts";

export default function MockTestCard({ onPress }) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.isDark ? "#111827" : "#F8FAFC",
          borderColor: theme.isDark ? "#1F2937" : "#E2E8F0"
        },
        pressed && styles.pressed
      ]}
    >
      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badgePill,
              {
                backgroundColor: theme.isDark ? "#1F2937" : "#FFFFFF",
                borderColor: theme.isDark ? "#374151" : "#CBD5E1"
              }
            ]}
          >
            <MaterialCommunityIcons name="clipboard-text-outline" size={12} color={theme.isDark ? "#38BDF8" : "#0284C7"} />
            <Text style={[styles.badgeLabel, { color: theme.isDark ? "#38BDF8" : "#0284C7" }]}>
              REAL CBT EXPERIENCE • हिन्दी & EN
            </Text>
          </View>
        </View>

        <Text style={[styles.mainTitle, { color: theme.text }]}>Mock Test</Text>
        <Text style={[styles.subText, { color: theme.subtext }]}>Practice like the real exam • हिन्दी / English</Text>

        <View style={styles.footerRow}>
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.88 }
            ]}
          >
            <Text style={styles.ctaText}>Start Test →</Text>
          </Pressable>

          <View
            style={[
              styles.infoPill,
              {
                backgroundColor: theme.isDark ? "#1F2937" : "#FFFFFF",
                borderColor: theme.isDark ? "#374151" : "#E2E8F0"
              }
            ]}
          >
            <MaterialCommunityIcons name="layers-outline" size={12} color={theme.subtext} />
            <Text style={[styles.infoPillText, { color: theme.subtext }]}>
              Full Test • Subject Test • Topic Test
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16
  },
  pressed: {
    opacity: 0.95
  },
  content: {
    gap: 4
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
    borderWidth: 1
  },
  badgeLabel: {
    fontSize: 9.5,
    fontFamily: fonts.bold,
    letterSpacing: 0.3
  },
  mainTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    marginTop: 2
  },
  subText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 16
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6
  },
  ctaBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  ctaText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1
  },
  infoPillText: {
    fontSize: 10.5,
    fontFamily: fonts.medium
  }
});
