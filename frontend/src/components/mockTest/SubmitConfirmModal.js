import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../constants/fonts";

export default function SubmitConfirmModal({
  visible = false,
  testTitle = "Mock Test",
  answeredCount = 0,
  notAnsweredCount = 0,
  notVisitedCount = 0,
  markedCount = 0,
  selectedLanguage = "en",
  onContinue,
  onSubmit
}) {
  const { theme } = useTheme();
  const isHindi = selectedLanguage === "hi";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: theme.isDark ? "#312E81" : "#EEF2FF" }]}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={22} color={theme.isDark ? "#818CF8" : "#4F46E5"} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>
              {isHindi ? "मॉब टेस्ट जमा करें?" : "Submit Mock Test?"}
            </Text>
            <Text style={[styles.subTitle, { color: theme.subtext }]} numberOfLines={1}>
              {testTitle}
            </Text>
          </View>

          <View style={[styles.statsBox, { backgroundColor: theme.isDark ? "#111827" : "#F8FAFC", borderColor: theme.border }]}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.text }]}>
                {isHindi ? "उत्तर दिए गए:" : "Answered:"}
              </Text>
              <Text style={[styles.statValue, { color: "#16A34A" }]}>{answeredCount}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.text }]}>
                {isHindi ? "उत्तर नहीं दिए गए:" : "Not Answered:"}
              </Text>
              <Text style={[styles.statValue, { color: "#DC2626" }]}>{notAnsweredCount}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.text }]}>
                {isHindi ? "देखा नहीं गया:" : "Not Visited:"}
              </Text>
              <Text style={[styles.statValue, { color: theme.subtext }]}>{notVisitedCount}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.text }]}>
                {isHindi ? "समीक्षा के लिए चिन्हित:" : "Marked for Review:"}
              </Text>
              <Text style={[styles.statValue, { color: "#9333EA" }]}>{markedCount}</Text>
            </View>
          </View>

          <Text style={[styles.warningText, { color: theme.subtext }]}>
            {isHindi
              ? "क्या आप निश्चित रूप से अपना टेस्ट समाप्त करना चाहते हैं? सबमिट करने के बाद आप उत्तर नहीं बदल सकते।"
              : "Are you sure you want to finish your attempt? Once submitted, you cannot change your answers."}
          </Text>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={onContinue}
              style={({ pressed }) => [
                styles.btnSecondary,
                { borderColor: theme.border, backgroundColor: theme.isDark ? "#1F2937" : "#FFFFFF" },
                pressed && { opacity: 0.85 }
              ]}
            >
              <Text style={[styles.btnSecondaryText, { color: theme.text }]}>
                {isHindi ? "टेस्ट जारी रखें" : "Continue Test"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onSubmit}
              style={({ pressed }) => [
                styles.btnPrimary,
                { backgroundColor: "#DC2626" },
                pressed && { opacity: 0.88 }
              ]}
            >
              <Text style={styles.btnPrimaryText}>
                {isHindi ? "टेस्ट सबमिट करें" : "Submit Test"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12
  },
  header: {
    alignItems: "center",
    gap: 3
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.bold
  },
  subTitle: {
    fontSize: 12,
    fontFamily: fonts.medium
  },
  statsBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 6
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.medium
  },
  statValue: {
    fontSize: 13,
    fontFamily: fonts.bold
  },
  warningText: {
    fontSize: 11.5,
    fontFamily: fonts.regular,
    textAlign: "center",
    lineHeight: 16
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  btnSecondaryText: {
    fontSize: 12,
    fontFamily: fonts.bold
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  btnPrimaryText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  }
});
