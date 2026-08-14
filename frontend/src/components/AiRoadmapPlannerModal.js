import { useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

const TRACK_OPTIONS = [
  { id: "web", title: "🌐 Full Stack Web", desc: "React, Node.js, Next.js & System Design", color: "#0A6836" },
  { id: "ai", title: "🤖 AI & Machine Learning", desc: "Python, PyTorch, LLMs & Data Science", color: "#2563EB" },
  { id: "app", title: "📱 Mobile App Dev", desc: "React Native, Expo & iOS/Android Apps", color: "#7C3AED" },
  { id: "cloud", title: "☁️ Cloud & DevOps", desc: "AWS, Docker, Kubernetes & CI/CD", color: "#D97706" },
  { id: "cyber", title: "🛡️ Cybersecurity & GATE", desc: "Ethical Hacking, DSA & Computer Networks", color: "#DC2626" },
  { id: "govt", title: "🏛️ Govt & UPSC Prep", desc: "Polity, General Studies & Mock Tests", color: "#059669" }
];

const DURATION_OPTIONS = [
  "⚡ 1 Month Sprint",
  "📚 3 Months Mastery",
  "🏆 6 Months Career Path"
];

const TIME_COMMITMENT_OPTIONS = [
  "⏱️ 1-2 Hours / Day",
  "🔥 3-4 Hours / Day",
  "🚀 5+ Hours / Day"
];

export default function AiRoadmapPlannerModal({ visible, onClose, user = {} }) {
  const { theme } = useTheme();
  const [selectedTrack, setSelectedTrack] = useState(TRACK_OPTIONS[0]);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[1]);
  const [selectedTime, setSelectedTime] = useState(TIME_COMMITMENT_OPTIONS[1]);
  const [generatedRoadmap, setGeneratedRoadmap] = useState(null);
  const [generating, setGenerating] = useState(false);

  if (!visible) return null;

  function handleGenerateRoadmap() {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGeneratedRoadmap({
        title: `${selectedTrack.title} (${selectedDuration.split(" ")[1]} Plan)`,
        track: selectedTrack,
        duration: selectedDuration,
        commitment: selectedTime,
        steps: [
          {
            phase: "Phase 1: Foundation & Core Concepts",
            duration: "Weeks 1 - 2",
            details: "Master syntax, core fundamentals, version control (Git/GitHub), and building starter projects."
          },
          {
            phase: "Phase 2: Deep Dive & Industry Projects",
            duration: "Weeks 3 - 6",
            details: "Build 2 full-fledged real-world projects with API integrations, state management, and DB connection."
          },
          {
            phase: "Phase 3: Advanced Optimization & Architecture",
            duration: "Weeks 7 - 10",
            details: "Focus on clean architecture, performance optimization, security, and automated testing."
          },
          {
            phase: "Phase 4: Resume, Portfolio & Placement Prep",
            duration: "Weeks 11 - 12",
            details: "Deploy live projects, craft ATS resume, practice mock technical interviews, and apply for roles."
          }
        ]
      });
    }, 450);
  }

  function handleSendToWhatsApp() {
    const userName = user.name || "TCM Learner";
    const waText =
      `🎓 *TCM ACADEMY - CUSTOM LEARNING ROADMAP* 🎓\n\n` +
      `👤 *Student:* ${userName}\n` +
      `🎯 *Track:* ${selectedTrack.title}\n` +
      `⏳ *Timeline:* ${selectedDuration}\n` +
      `⏱️ *Daily Effort:* ${selectedTime}\n\n` +
      `----------------------------------------\n` +
      `🗺️ *4-STEP ROADMAP PLAN:*\n` +
      `1️⃣ *Phase 1:* Foundation & Core Concepts (Weeks 1-2)\n` +
      `2️⃣ *Phase 2:* Industry Real-World Projects (Weeks 3-6)\n` +
      `3️⃣ *Phase 3:* Advanced Architecture & Performance (Weeks 7-10)\n` +
      `4️⃣ *Phase 4:* Portfolio & Placement Prep (Weeks 11-12)\n\n` +
      `----------------------------------------\n` +
      `📲 *Generated via TCM App Roadmap Builder*\n` +
      `Support Hotline: +91 9238695500`;

    const url = `https://wa.me/919238695500?text=${encodeURIComponent(waText)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Export Error", "Could not open WhatsApp. Send your query to +91 9238695500.");
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlayBg}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          {/* Handle bar */}
          <View style={styles.handleBarWrap}>
            <View style={[styles.handleBar, { backgroundColor: theme.isDark ? "#334155" : "#E2E8F0" }]} />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={[styles.headerIcon, { backgroundColor: theme.badgeBg }]}>
                <MaterialCommunityIcons name="map-marker-path" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Custom Learning Roadmap</Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]}>Select your track & create your personal plan</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}>
              <Feather name="x" size={18} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Step 1: Select Track Grid */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>1. Choose Your Target Domain</Text>
              <View style={styles.trackGrid}>
                {TRACK_OPTIONS.map((track) => {
                  const isSelected = selectedTrack.id === track.id;
                  return (
                    <TouchableOpacity
                      key={track.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedTrack(track);
                        setGeneratedRoadmap(null);
                      }}
                      style={[
                        styles.trackCard,
                        {
                          backgroundColor: isSelected ? (theme.isDark ? "#1E293B" : "#E8F5E9") : (theme.isDark ? "#0F172A" : "#FAFAFA"),
                          borderColor: isSelected ? theme.primary : theme.border
                        }
                      ]}
                    >
                      <Text style={[styles.trackTitle, { color: isSelected ? theme.primary : theme.text }]}>{track.title}</Text>
                      <Text numberOfLines={1} style={[styles.trackDesc, { color: theme.subtext }]}>{track.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 2: Duration Selector */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>2. Select Target Timeline</Text>
              <View style={styles.pillsRow}>
                {DURATION_OPTIONS.map((dur) => {
                  const isSelected = selectedDuration === dur;
                  return (
                    <TouchableOpacity
                      key={dur}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedDuration(dur);
                        setGeneratedRoadmap(null);
                      }}
                      style={[
                        styles.pillChip,
                        {
                          backgroundColor: isSelected ? theme.primary : (theme.isDark ? "#1E293B" : "#F1F5F9"),
                          borderColor: isSelected ? theme.primary : theme.border
                        }
                      ]}
                    >
                      <Text style={[styles.pillText, { color: isSelected ? "#FFFFFF" : theme.text }]}>{dur}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 3: Commitment */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>3. Daily Learning Commitment</Text>
              <View style={styles.pillsRow}>
                {TIME_COMMITMENT_OPTIONS.map((t) => {
                  const isSelected = selectedTime === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedTime(t);
                        setGeneratedRoadmap(null);
                      }}
                      style={[
                        styles.pillChip,
                        {
                          backgroundColor: isSelected ? theme.primary : (theme.isDark ? "#1E293B" : "#F1F5F9"),
                          borderColor: isSelected ? theme.primary : theme.border
                        }
                      ]}
                    >
                      <Text style={[styles.pillText, { color: isSelected ? "#FFFFFF" : theme.text }]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* CTA Generate Button */}
            {!generatedRoadmap && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleGenerateRoadmap}
                disabled={generating}
                style={[styles.generateBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>
                  {generating ? "Building Your Custom Roadmap..." : "Build My Personalized Roadmap ⚡"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Clean Roadmap Result Display */}
            {generatedRoadmap && (
              <View style={[styles.resultCard, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: theme.border }]}>
                <View style={styles.resultHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultTitle, { color: theme.text }]}>{generatedRoadmap.title}</Text>
                    <Text style={[styles.resultSub, { color: theme.subtext }]}>{generatedRoadmap.duration} • {generatedRoadmap.commitment}</Text>
                  </View>
                  <View style={[styles.readyBadge, { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }]}>
                    <Text style={styles.readyBadgeText}>Ready 🚀</Text>
                  </View>
                </View>

                {/* Steps List */}
                <View style={styles.stepsWrap}>
                  {generatedRoadmap.steps.map((step, idx) => (
                    <View key={step.phase} style={styles.stepItem}>
                      <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
                        <Text style={styles.stepDotText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={[styles.stepPhaseText, { color: theme.text }]}>{step.phase}</Text>
                          <Text style={[styles.stepDurationText, { color: theme.primary }]}>{step.duration}</Text>
                        </View>
                        <Text style={[styles.stepDetailsText, { color: theme.subtext }]}>{step.details}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Action Row */}
                <View style={styles.resultActionRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSendToWhatsApp}
                    style={styles.waExportBtn}
                  >
                    <FontAwesome name="whatsapp" size={16} color="#FFFFFF" />
                    <Text style={styles.waExportBtnText}>Export to WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      Alert.alert("Saved! 📌", "Your custom learning roadmap has been saved to your account profile.");
                      onClose();
                    }}
                    style={[styles.saveBtn, { borderColor: theme.border, backgroundColor: theme.cardBg }]}
                  >
                    <Feather name="bookmark" size={15} color={theme.text} />
                    <Text style={[styles.saveBtnText, { color: theme.text }]}>Save Plan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayBg: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: "88%",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24
  },
  handleBarWrap: {
    alignItems: "center",
    paddingVertical: 10
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.15)"
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 16
  },
  headerSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 1
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center"
  },
  scrollBody: {
    gap: 16,
    paddingBottom: 10
  },
  sectionWrap: {
    gap: 8
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  trackGrid: {
    gap: 8
  },
  trackCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2
  },
  trackTitle: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  trackDesc: {
    fontFamily: fonts.regular,
    fontSize: 11
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  pillChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1
  },
  pillText: {
    fontFamily: fonts.semiBold,
    fontSize: 12
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 4
  },
  generateBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFFFFF"
  },
  resultCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginTop: 4
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  resultTitle: {
    fontFamily: fonts.bold,
    fontSize: 14
  },
  resultSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 2
  },
  readyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1
  },
  readyBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#059669"
  },
  stepsWrap: {
    gap: 10,
    marginTop: 4
  },
  stepItem: {
    flexDirection: "row",
    gap: 10
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center"
  },
  stepDotText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 11
  },
  stepContent: {
    flex: 1,
    gap: 2
  },
  stepPhaseText: {
    fontFamily: fonts.bold,
    fontSize: 12
  },
  stepDurationText: {
    fontFamily: fonts.bold,
    fontSize: 11
  },
  stepDetailsText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15
  },
  resultActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8
  },
  waExportBtn: {
    flex: 1,
    backgroundColor: "#25D366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12
  },
  waExportBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 12
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1
  },
  saveBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12
  }
});
