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

const AVAILABLE_COURSES = [
  { id: "c1", name: "Full Stack Web Masterclass", category: "Development", price: 4999, durationMonths: 3, icon: "code-slash" },
  { id: "c2", name: "AI & Data Science Masterclass", category: "Artificial Intelligence", price: 5999, durationMonths: 3, icon: "sparkles" },
  { id: "c3", name: "Mobile App Dev (React Native)", category: "Mobile Apps", price: 3999, durationMonths: 2, icon: "phone-portrait" },
  { id: "c4", name: "Python & DSA Foundations", category: "Core Coding", price: 2999, durationMonths: 2, icon: "terminal" },
  { id: "c5", name: "UPSC & Govt Exam GS Masterclass", category: "Govt Preparation", price: 3499, durationMonths: 3, icon: "school" }
];

const TARGET_GOAL_OPTIONS = [
  { id: "job", title: "Job Placement & ATS Resume", icon: "briefcase" },
  { id: "exam", title: "Competitive Exam Preparation", icon: "award" },
  { id: "projects", title: "Real World Live Projects", icon: "layers" }
];

const STUDY_COMMITMENT_OPTIONS = [
  "1-2 Hours / Day",
  "3-4 Hours / Day",
  "5+ Hours / Day"
];

export default function AiRoadmapPlannerModal({ visible, onClose, user = {} }) {
  const { theme } = useTheme();
  const [selectedCourseIds, setSelectedCourseIds] = useState(["c1"]);
  const [selectedGoal, setSelectedGoal] = useState("job");
  const [selectedCommitment, setSelectedCommitment] = useState("3-4 Hours / Day");
  const [generatedRoadmap, setGeneratedRoadmap] = useState(null);
  const [generating, setGenerating] = useState(false);

  if (!visible) return null;

  const selectedCourses = AVAILABLE_COURSES.filter((c) => selectedCourseIds.includes(c.id));
  const totalPackageAmount = selectedCourses.reduce((sum, c) => sum + c.price, 0);
  const totalDurationMonths = selectedCourses.reduce((sum, c) => sum + c.durationMonths, 0);

  function toggleCourseSelection(courseId) {
    setGeneratedRoadmap(null);
    setSelectedCourseIds((prev) => {
      if (prev.includes(courseId)) {
        if (prev.length === 1) {
          Alert.alert("Course Selection", "Please keep at least 1 course selected to build your roadmap.");
          return prev;
        }
        return prev.filter((id) => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  }

  function handleGenerateAiRoadmap() {
    if (selectedCourseIds.length === 0) {
      Alert.alert("Select Course", "Please pick at least 1 course from the list below.");
      return;
    }

    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);

      const goalObj = TARGET_GOAL_OPTIONS.find((g) => g.id === selectedGoal);
      const courseNames = selectedCourses.map((c) => c.name).join(" + ");

      setGeneratedRoadmap({
        title: `AI Roadmap: ${courseNames}`,
        totalPrice: totalPackageAmount,
        totalDuration: totalDurationMonths,
        goal: goalObj?.title || "Career Growth",
        commitment: selectedCommitment,
        phases: [
          {
            title: "Phase 1: Foundations & Core Concepts",
            duration: "Month 1",
            details: `Master core concepts of ${selectedCourses[0]?.name || "selected courses"}. Practice 15+ coding/theory challenges weekly with ${selectedCommitment}.`
          },
          {
            title: "Phase 2: Project Building & Applied Practical",
            duration: "Month 2",
            details: `Build 2 production-grade real-world projects based on your ${selectedCourses.map((c) => c.category).join(" & ")} package.`
          },
          {
            title: "Phase 3: Advanced Architectures & Exam Drills",
            duration: totalDurationMonths > 2 ? "Month 3" : "Weeks 7 - 8",
            details: `Focus on performance optimization, mock tests, code reviews with TCM mentors, and deep subject mastery.`
          },
          {
            title: "Phase 4: Resume, Portfolio & Career Launch",
            duration: `Final ${totalDurationMonths} Month Target`,
            details: `Finalize live project links, ATS-friendly resume review, mock interviews with TCM mentors, and direct referral opportunities.`
          }
        ]
      });
    }, 500);
  }

  function handleShareToWhatsApp() {
    const userName = user.name || "TCM Student";
    const courseListStr = selectedCourses.map((c) => `• ${c.name} (₹${c.price.toLocaleString()})`).join("\n");
    const goalObj = TARGET_GOAL_OPTIONS.find((g) => g.id === selectedGoal);

    const waMsg =
      `🎓 *TCM ACADEMY - CUSTOM AI LEARNING ROADMAP* 🎓\n\n` +
      `👤 *Student Name:* ${userName}\n` +
      `📦 *Selected Package Courses (${selectedCourses.length}):*\n${courseListStr}\n\n` +
      `📊 *PACKAGE COUNTER SUMMARY:*\n` +
      `⏳ *Total Duration:* ${totalDurationMonths} Months\n` +
      `💰 *Total Package Amount:* ₹${totalPackageAmount.toLocaleString()}\n` +
      `🎯 *Primary Target Goal:* ${goalObj?.title || "Career Growth"}\n` +
      `⏱️ *Daily Effort:* ${selectedCommitment}\n\n` +
      `----------------------------------------\n` +
      `🗺️ *GENERATED AI ROADMAP PHASES:*\n` +
      `1️⃣ Phase 1: Foundations & Core Concepts (Month 1)\n` +
      `2️⃣ Phase 2: Project Building & Applied Practical (Month 2)\n` +
      `3️⃣ Phase 3: Advanced Architectures & Exam Drills (Month 3)\n` +
      `4️⃣ Phase 4: Resume, Portfolio & Career Launch\n\n` +
      `----------------------------------------\n` +
      `📲 *Generated via TCM App AI Counselor*\n` +
      `Contact TCM Mentor: +91 9238695500`;

    const url = `https://wa.me/919238695500?text=${encodeURIComponent(waMsg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("WhatsApp Error", "Could not open WhatsApp automatically. Contact Hotline: +91 9238695500.");
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
                <Ionicons name="sparkles" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Custom AI Learning Roadmap</Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]}>Select courses to count package & build AI plan</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}>
              <Feather name="x" size={18} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Single Pre-suggestion Initial Message Banner */}
            <View style={[styles.welcomeMsgCard, { backgroundColor: theme.isDark ? "#1E1B4B" : "#E8F5E9", borderColor: theme.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <MaterialCommunityIcons name="robot" size={18} color={theme.primary} />
                <Text style={[styles.welcomeMsgTitle, { color: theme.primary }]}>TCM AI Counselor</Text>
              </View>
              <Text style={[styles.welcomeMsgText, { color: theme.text }]}>
                Welcome to TCM Academy! Pick your desired courses below one by one. Our system will count your total duration & package amount live, and AI will structure your custom step-by-step roadmap.
              </Text>
            </View>

            {/* Course Selector List */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>1. Select Available TCM Courses (Pick One by One)</Text>
              <View style={{ gap: 8 }}>
                {AVAILABLE_COURSES.map((course) => {
                  const isSelected = selectedCourseIds.includes(course.id);
                  return (
                    <TouchableOpacity
                      key={course.id}
                      activeOpacity={0.8}
                      onPress={() => toggleCourseSelection(course.id)}
                      style={[
                        styles.coursePickCard,
                        {
                          backgroundColor: isSelected ? (theme.isDark ? "#1E293B" : "#F0FDF4") : (theme.isDark ? "#0F172A" : "#FAFAFA"),
                          borderColor: isSelected ? theme.primary : theme.border
                        }
                      ]}
                    >
                      <View style={[styles.checkboxCircle, { backgroundColor: isSelected ? theme.primary : "transparent", borderColor: isSelected ? theme.primary : theme.subtext }]}>
                        {isSelected && <Feather name="check" size={12} color="#FFFFFF" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.courseNameText, { color: isSelected ? theme.primary : theme.text }]}>{course.name}</Text>
                        <Text style={[styles.courseCategoryText, { color: theme.subtext }]}>{course.category} • {course.durationMonths} Months</Text>
                      </View>
                      <Text style={[styles.coursePriceText, { color: theme.primary }]}>₹{course.price.toLocaleString()}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Live Package Counter Summary Box */}
            <View style={[styles.counterBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: theme.border }]}>
              <View style={styles.counterRow}>
                <View style={styles.counterCol}>
                  <Text style={[styles.counterLabel, { color: theme.subtext }]}>Selected Courses</Text>
                  <Text style={[styles.counterValue, { color: theme.text }]}>{selectedCourses.length} Courses</Text>
                </View>
                <View style={styles.counterCol}>
                  <Text style={[styles.counterLabel, { color: theme.subtext }]}>Total Duration</Text>
                  <Text style={[styles.counterValue, { color: theme.text }]}>{totalDurationMonths} Months</Text>
                </View>
                <View style={styles.counterCol}>
                  <Text style={[styles.counterLabel, { color: theme.subtext }]}>Package Amount</Text>
                  <Text style={[styles.counterValuePrice, { color: theme.primary }]}>₹{totalPackageAmount.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* Step 2: AI Goal Questions */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionLabel, { color: theme.text }]}>2. AI Counselor Questioning</Text>
              <Text style={[styles.questionSubText, { color: theme.subtext }]}>What is your primary target goal?</Text>
              <View style={{ gap: 8, marginTop: 4 }}>
                {TARGET_GOAL_OPTIONS.map((g) => {
                  const isSelected = selectedGoal === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedGoal(g.id);
                        setGeneratedRoadmap(null);
                      }}
                      style={[
                        styles.goalCard,
                        {
                          backgroundColor: isSelected ? (theme.isDark ? "#1E293B" : "#F0EDFF") : (theme.isDark ? "#0F172A" : "#FAFAFA"),
                          borderColor: isSelected ? theme.primary : theme.border
                        }
                      ]}
                    >
                      <Feather name={g.icon} size={16} color={isSelected ? theme.primary : theme.subtext} />
                      <Text style={[styles.goalText, { color: isSelected ? theme.primary : theme.text }]}>{g.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.questionSubText, { color: theme.subtext, marginTop: 12 }]}>Daily Study Commitment?</Text>
              <View style={styles.pillsRow}>
                {STUDY_COMMITMENT_OPTIONS.map((c) => {
                  const isSelected = selectedCommitment === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedCommitment(c);
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
                      <Text style={[styles.pillText, { color: isSelected ? "#FFFFFF" : theme.text }]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Generate CTA Button */}
            {!generatedRoadmap && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleGenerateAiRoadmap}
                disabled={generating}
                style={[styles.generateBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>
                  {generating ? "AI is Structuring Your Roadmap..." : "Generate AI Roadmap & Count Package"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Generated AI Roadmap Result Display */}
            {generatedRoadmap && (
              <View style={[styles.resultCard, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: theme.border }]}>
                <View style={styles.resultHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultTitle, { color: theme.text }]}>{generatedRoadmap.title}</Text>
                    <Text style={[styles.resultSub, { color: theme.subtext }]}>
                      Total: ₹{generatedRoadmap.totalPrice.toLocaleString()} • {generatedRoadmap.totalDuration} Months • {generatedRoadmap.commitment}
                    </Text>
                  </View>
                  <View style={[styles.readyBadge, { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }]}>
                    <Text style={styles.readyBadgeText}>AI Plan Ready</Text>
                  </View>
                </View>

                {/* Phases List */}
                <View style={styles.stepsWrap}>
                  {generatedRoadmap.phases.map((phase, idx) => (
                    <View key={phase.title} style={styles.stepItem}>
                      <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
                        <Text style={styles.stepDotText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={[styles.stepPhaseText, { color: theme.text }]}>{phase.title}</Text>
                          <Text style={[styles.stepDurationText, { color: theme.primary }]}>{phase.duration}</Text>
                        </View>
                        <Text style={[styles.stepDetailsText, { color: theme.subtext }]}>{phase.details}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* WhatsApp Share CTA */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleShareToWhatsApp}
                  style={styles.waShareBtn}
                >
                  <FontAwesome name="whatsapp" size={18} color="#FFFFFF" />
                  <Text style={styles.waShareBtnText}>Share Roadmap & Package to WhatsApp</Text>
                </TouchableOpacity>
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
  welcomeMsgCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1
  },
  welcomeMsgTitle: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  welcomeMsgText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17
  },
  sectionWrap: {
    gap: 8
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  questionSubText: {
    fontFamily: fonts.semiBold,
    fontSize: 12
  },
  coursePickCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  courseNameText: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  courseCategoryText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 1
  },
  coursePriceText: {
    fontFamily: fonts.bold,
    fontSize: 13
  },
  counterBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  counterCol: {
    alignItems: "center"
  },
  counterLabel: {
    fontFamily: fonts.regular,
    fontSize: 10
  },
  counterValue: {
    fontFamily: fonts.bold,
    fontSize: 13,
    marginTop: 2
  },
  counterValuePrice: {
    fontFamily: fonts.bold,
    fontSize: 14,
    marginTop: 2
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    borderRadius: 12,
    borderWidth: 1
  },
  goalText: {
    fontFamily: fonts.semiBold,
    fontSize: 12
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
  waShareBtn: {
    backgroundColor: "#25D366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 6
  },
  waShareBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 13
  }
});
