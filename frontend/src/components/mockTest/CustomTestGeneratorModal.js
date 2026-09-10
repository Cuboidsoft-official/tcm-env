import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../constants/fonts";

export default function CustomTestGeneratorModal({
  visible = false,
  selectedExamName = "SSC CGL",
  selectedLanguage = "en",
  onClose,
  onGenerate
}) {
  const { theme } = useTheme();
  const isHindi = selectedLanguage === "hi";

  const [selectedSubject, setSelectedSubject] = useState("Reasoning");
  const [questionCount, setQuestionCount] = useState(20);
  const [difficulty, setDifficulty] = useState("Mixed");

  const subjects = [
    { en: "Reasoning", hi: "रीजनिंग" },
    { en: "Quantitative Aptitude", hi: "गणित" },
    { en: "General Awareness", hi: "जीके / सामान्य ज्ञान" },
    { en: "English", hi: "अंग्रेजी" }
  ];
  const counts = [10, 20, 30, 50];
  const difficulties = ["Easy", "Medium", "Hard", "Mixed"];

  function handleGenerate() {
    const customTestObj = {
      id: `custom_${Date.now()}`,
      examName: selectedExamName,
      title: `${selectedExamName} Custom Practice (${selectedSubject})`,
      testType: "custom",
      durationMins: Math.ceil(questionCount * 1.2),
      totalQuestions: questionCount,
      maxMarks: questionCount * 2,
      positiveMarks: 2.0,
      negativeMarking: 0.5,
      difficulty,
      languages: ["English", "Hindi"],
      status: "Not Attempted"
    };

    onGenerate(customTestObj);
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>
                {isHindi ? "अपना टेस्ट तैयार करें" : "Create Your Test"}
              </Text>
              <Text style={[styles.subTitle, { color: theme.subtext }]}>
                {selectedExamName} {isHindi ? "के लिए व्यक्तिगत अभ्यास टेस्ट" : "personalized practice test"}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={18} color={theme.subtext} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
            {/* Subject Selector */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>{isHindi ? "विषय चुनें" : "Select Subject"}</Text>
              <View style={styles.chipGrid}>
                {subjects.map((sub) => {
                  const active = selectedSubject === sub.en;
                  return (
                    <Pressable
                      key={sub.en}
                      onPress={() => setSelectedSubject(sub.en)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? theme.primary : theme.isDark ? "#1F2937" : "#F1F5F9",
                          borderColor: active ? theme.primary : theme.border
                        }
                      ]}
                    >
                      <Text style={[styles.chipText, { color: active ? "#FFFFFF" : theme.text }]}>
                        {isHindi ? sub.hi : sub.en}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Question Count */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>{isHindi ? "प्रश्नों की संख्या" : "Number of Questions"}</Text>
              <View style={styles.chipRow}>
                {counts.map((cnt) => {
                  const active = questionCount === cnt;
                  return (
                    <Pressable
                      key={cnt}
                      onPress={() => setQuestionCount(cnt)}
                      style={[
                        styles.chipNum,
                        {
                          backgroundColor: active ? theme.primary : theme.isDark ? "#1F2937" : "#F1F5F9",
                          borderColor: active ? theme.primary : theme.border
                        }
                      ]}
                    >
                      <Text style={[styles.chipNumText, { color: active ? "#FFFFFF" : theme.text }]}>
                        {cnt} Qs
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Difficulty Selector */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>{isHindi ? "कठिनाई स्तर" : "Difficulty Level"}</Text>
              <View style={styles.chipRow}>
                {difficulties.map((diff) => {
                  const active = difficulty === diff;
                  return (
                    <Pressable
                      key={diff}
                      onPress={() => setDifficulty(diff)}
                      style={[
                        styles.chipFlex,
                        {
                          backgroundColor: active ? theme.primary : theme.isDark ? "#1F2937" : "#F1F5F9",
                          borderColor: active ? theme.primary : theme.border
                        }
                      ]}
                    >
                      <Text style={[styles.chipText, { color: active ? "#FFFFFF" : theme.text }]}>{diff}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <Pressable
            onPress={handleGenerate}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.88 }
            ]}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={16} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>{isHindi ? "टेस्ट जनरेट करें →" : "Generate Practice Test →"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end"
  },
  card: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 16,
    maxHeight: "80%",
    gap: 12
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between"
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.bold
  },
  subTitle: {
    fontSize: 11.5,
    fontFamily: fonts.regular,
    marginTop: 1
  },
  closeBtn: {
    padding: 3
  },
  formContent: {
    gap: 12,
    paddingVertical: 2
  },
  formGroup: {
    gap: 6
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.bold
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  chipRow: {
    flexDirection: "row",
    gap: 6
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1
  },
  chipNum: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center"
  },
  chipFlex: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center"
  },
  chipText: {
    fontSize: 11.5,
    fontFamily: fonts.medium
  },
  chipNumText: {
    fontSize: 11.5,
    fontFamily: fonts.bold
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10
  },
  submitBtnText: {
    fontSize: 12.5,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  }
});
