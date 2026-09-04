import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../constants/fonts";

export default function ComingSoonCategoryModal({ visible, categoryName = "Category", onClose, onExploreIt, onNotify }) {
  const { theme } = useTheme();
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: theme.isDark ? "#1E293B" : "#FFFFFF", borderColor: theme.isDark ? "#334155" : "#E2E8F0" }]} onPress={(e) => e.stopPropagation()}>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, { backgroundColor: theme.isDark ? "#334155" : "#F1F5F9" }, pressed && { opacity: 0.7 }]}>
            <Feather name="x" size={18} color={theme.text} />
          </Pressable>
          <View style={[styles.iconCircle, { backgroundColor: theme.isDark ? "#1E1B4B" : "#EEECFE" }]}>
            <MaterialCommunityIcons name="rocket-launch-outline" size={38} color={theme.primary} />
          </View>
          <View style={[styles.tagPill, { backgroundColor: theme.badgeBg }]}>
            <Text style={[styles.tagText, { color: theme.primary }]}>?? LAUNCHING SOON</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>{categoryName} Stream</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            We are currently focusing 100% of our ecosystem on <Text style={{ fontFamily: fonts.bold, color: theme.text }}>IT & Software Engineering</Text> careers on TCM One!
          </Text>
          <Text style={[styles.bodyText, { color: theme.subtext }]}>
            Live batches, notes, and mentor networks for <Text style={{ fontFamily: fonts.bold, color: theme.primary }}>{categoryName}</Text> are under active preparation and will unlock in upcoming platform updates.
          </Text>
          <View style={[styles.highlightBox, { backgroundColor: theme.isDark ? "#064E3B" : "#ECFDF5", borderColor: "#A7F3D0" }]}>
            <MaterialCommunityIcons name="check-decagram" size={18} color="#10B981" style={{ marginRight: 8 }} />
            <Text style={[styles.highlightText, { color: theme.isDark ? "#A7F3D0" : "#065F46" }]}>
              ? IT & Software Engineering is 100% Live & Unlocked!
            </Text>
          </View>
          <View style={styles.btnRow}>
            <Pressable onPress={() => { if (onExploreIt) onExploreIt(); if (onClose) onClose(); }} style={({ pressed }) => [styles.primaryBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.85 }]}>
              <MaterialCommunityIcons name="code-tags" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.primaryBtnText}>Explore IT Courses ??</Text>
            </Pressable>
            <Pressable onPress={() => { if (onNotify) onNotify(categoryName); if (onClose) onClose(); }} style={({ pressed }) => [styles.secondaryBtn, { borderColor: theme.isDark ? "#334155" : "#CBD5E1" }, pressed && { opacity: 0.7 }]}>
              <Feather name="bell" size={15} color={theme.text} style={{ marginRight: 6 }} />
              <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Notify Me On Launch ??</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.65)", justifyContent: "center", alignItems: "center", padding: 20 },
  card: { width: "100%", maxWidth: 420, borderRadius: 24, padding: 24, alignItems: "center", borderWidth: 1, position: "relative" },
  closeBtn: { position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", zIndex: 10 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  tagPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  tagText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.5 },
  title: { fontFamily: fonts.bold, fontSize: 20, textAlign: "center", marginBottom: 8 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: 8 },
  bodyText: { fontFamily: fonts.regular, fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 16 },
  highlightBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, width: "100%", marginBottom: 20 },
  highlightText: { fontFamily: fonts.bold, fontSize: 11.5, flex: 1 },
  btnRow: { width: "100%", gap: 10 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 14 },
  primaryBtnText: { fontFamily: fonts.bold, fontSize: 14, color: "#FFFFFF" },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  secondaryBtnText: { fontFamily: fonts.bold, fontSize: 13 }
});
