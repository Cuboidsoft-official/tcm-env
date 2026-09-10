import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../constants/fonts";

export default function ResultDashboard({
  result = {},
  testTitle = "Mock Test",
  questions = [],
  userAnswers = {},
  selectedLanguage = "en",
  onRetest,
  onPracticeTopic,
  onGoHome
}) {
  const { theme } = useTheme();
  const [showSolutions, setShowSolutions] = useState(false);
  const [savedQuestionIds, setSavedQuestionIds] = useState(new Set());
  const isHindi = selectedLanguage === "hi";

  const score = result.score ?? 72;
  const maxScore = result.maxScore ?? 100;
  const accuracy = result.accuracy ?? 81;
  const attempted = result.attempted ?? 89;
  const correct = result.correct ?? 72;
  const wrong = result.wrong ?? 17;
  const skipped = result.skipped ?? 11;
  const timeTakenSec = result.timeTakenSec ?? 3138;

  const minutes = Math.floor(timeTakenSec / 60);
  const seconds = timeTakenSec % 60;
  const timeDisplay = `${minutes}m ${seconds}s`;

  const subjectPerf = result.subjectPerformance && result.subjectPerformance.length > 0
    ? result.subjectPerformance
    : [
        { subject: "General Intelligence & Reasoning", score: 42, maxScore: 50, correct: 21, total: 25, accuracy: 88 },
        { subject: "English Comprehension", score: 36, maxScore: 50, correct: 18, total: 25, accuracy: 82 },
        { subject: "Quantitative Aptitude", score: 24, maxScore: 50, correct: 12, total: 25, accuracy: 61 },
        { subject: "General Awareness", score: 32, maxScore: 50, correct: 16, total: 25, accuracy: 76 }
      ];

  const weakTopics = result.weakTopics && result.weakTopics.length > 0
    ? result.weakTopics
    : [
        { topicId: "top_percentage", topicName: "Percentage", accuracy: 42, recommendedCount: 15 },
        { topicId: "top_profit_loss", topicName: "Profit & Loss", accuracy: 48, recommendedCount: 20 },
        { topicId: "top_current_affairs", topicName: "Current Affairs", accuracy: 52, recommendedCount: 15 }
      ];

  const strongTopics = result.strongTopics && result.strongTopics.length > 0
    ? result.strongTopics
    : [
        { topicName: "Coding-Decoding", accuracy: 95 },
        { topicName: "Analogy", accuracy: 90 },
        { topicName: "Vocabulary", accuracy: 85 }
      ];

  function toggleSaveQuestion(qId) {
    setSavedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
        Alert.alert("Removed", "Question removed from your saved bookmarks.");
      } else {
        next.add(qId);
        Alert.alert("Saved!", "Question saved to your bookmarks for revision.");
      }
      return next;
    });
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Header Banner */}
      <View style={[styles.headerCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={onGoHome} style={styles.backBtn}>
            <Feather name="arrow-left" size={16} color={theme.text} />
            <Text style={[styles.backText, { color: theme.text }]}>
              {isHindi ? "होम पर जाएं" : "Mock Test Home"}
            </Text>
          </Pressable>

          <View style={[styles.badge, { backgroundColor: theme.isDark ? "#064E3B" : "#DCFCE7" }]}>
            <Text style={[styles.badgeText, { color: theme.isDark ? "#A7F3D0" : "#166534" }]}>
              {isHindi ? "पूर्ण" : "COMPLETED"}
            </Text>
          </View>
        </View>

        <Text style={[styles.testTitle, { color: theme.text }]}>{testTitle}</Text>
        <Text style={[styles.testSub, { color: theme.subtext }]}>
          {isHindi ? "प्रदर्शन विश्लेषण एवं विस्तृत समाधान" : "Performance Analysis & Detailed Solutions"}
        </Text>

        {/* Primary Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: theme.isDark ? "#1E2937" : "#F8FAFC", borderColor: theme.border }]}>
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>{isHindi ? "प्राप्तांक" : "Score"}</Text>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {score} <Text style={styles.metricMax}>/ {maxScore}</Text>
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.isDark ? "#1E2937" : "#F8FAFC", borderColor: theme.border }]}>
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>{isHindi ? "सटीकता" : "Accuracy"}</Text>
            <Text style={[styles.metricValue, { color: accuracy >= 80 ? "#16A34A" : accuracy >= 60 ? "#CA8A04" : "#DC2626" }]}>
              {accuracy}%
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.isDark ? "#1E2937" : "#F8FAFC", borderColor: theme.border }]}>
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>{isHindi ? "लिया गया समय" : "Time Taken"}</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>{timeDisplay}</Text>
          </View>
        </View>

        {/* Secondary Metrics Row */}
        <View style={styles.secondaryStatsRow}>
          <View style={styles.subStat}>
            <Text style={[styles.subStatNum, { color: "#16A34A" }]}>{correct}</Text>
            <Text style={[styles.subStatLabel, { color: theme.subtext }]}>{isHindi ? "सही" : "Correct"}</Text>
          </View>
          <View style={styles.subStat}>
            <Text style={[styles.subStatNum, { color: "#DC2626" }]}>{wrong}</Text>
            <Text style={[styles.subStatLabel, { color: theme.subtext }]}>{isHindi ? "गलत" : "Wrong"}</Text>
          </View>
          <View style={styles.subStat}>
            <Text style={[styles.subStatNum, { color: theme.subtext }]}>{skipped}</Text>
            <Text style={[styles.subStatLabel, { color: theme.subtext }]}>{isHindi ? "छोड़े" : "Skipped"}</Text>
          </View>
          <View style={styles.subStat}>
            <Text style={[styles.subStatNum, { color: theme.text }]}>{attempted}</Text>
            <Text style={[styles.subStatLabel, { color: theme.subtext }]}>{isHindi ? "प्रयास किए" : "Attempted"}</Text>
          </View>
        </View>

        {/* Retest & Solution CTA Row */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => setShowSolutions(!showSolutions)}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.88 }
            ]}
          >
            <MaterialCommunityIcons name={showSolutions ? "table-of-contents" : "file-document-outline"} size={16} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>
              {showSolutions
                ? (isHindi ? "सारांश देखें" : "View Performance Summary")
                : (isHindi ? "उत्तर कुंजी एवं समाधान देखें" : "View Solutions")}
            </Text>
          </Pressable>

          <Pressable
            onPress={onRetest}
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: theme.border, backgroundColor: theme.isDark ? "#1F2937" : "#FFFFFF" },
              pressed && { opacity: 0.85 }
            ]}
          >
            <Feather name="rotate-ccw" size={14} color={theme.text} />
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
              {isHindi ? "पुनः प्रयास करें" : "Re-attempt Test"}
            </Text>
          </Pressable>
        </View>
      </View>

      {!showSolutions ? (
        <>
          {/* Phlappy AI Analysis Card */}
          <View style={[styles.aiCard, { backgroundColor: theme.isDark ? "#0F172A" : "#F0F9FF", borderColor: theme.isDark ? "#1E2937" : "#BAE6FD" }]}>
            <View style={styles.aiHeader}>
              <View style={[styles.aiBadge, { backgroundColor: theme.isDark ? "#1E2937" : "#FFFFFF" }]}>
                <MaterialCommunityIcons name="robot" size={13} color="#0284C7" />
                <Text style={[styles.aiBadgeText, { color: "#0284C7" }]}>Phlappy AI Analysis</Text>
              </View>
            </View>

            <Text style={[styles.aiMessage, { color: theme.isDark ? "#E2E8F0" : "#0F172A" }]}>
              {isHindi
                ? `“आपने रीजनिंग में अच्छा प्रदर्शन किया (${subjectPerf[0]?.accuracy || 88}%), लेकिन गणित में सुधार की आवश्यकता है। प्रतिशत और लाभ-हानि पर ध्यान केंद्रित करके आप 18+ अंक बढ़ा सकते हैं।”`
                : `“You performed strongly in Reasoning (${subjectPerf[0]?.accuracy || 88}%), but Quantitative Aptitude is pulling down your overall score. Focusing on Percentage and Profit & Loss will boost your target marks by +18 points.”`}
            </Text>

            <View style={styles.aiActionRow}>
              <Pressable
                onPress={() => onPracticeTopic && onPracticeTopic(weakTopics[0]?.topicName || "Percentage")}
                style={({ pressed }) => [
                  styles.aiBtn,
                  { backgroundColor: "#0284C7" },
                  pressed && { opacity: 0.88 }
                ]}
              >
                <Text style={styles.aiBtnText}>{isHindi ? "कमजोर विषय अभ्यास →" : "Practice Weak Topics →"}</Text>
              </Pressable>
            </View>
          </View>

          {/* Subject-Wise Performance */}
          <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>
              {isHindi ? "विषयवार प्रदर्शन" : "Subject-Wise Performance"}
            </Text>
            <View style={styles.subjectList}>
              {subjectPerf.map((sub, idx) => (
                <View key={idx} style={styles.subjectItem}>
                  <View style={styles.subjectRowHeader}>
                    <Text style={[styles.subjectName, { color: theme.text }]}>{sub.subject}</Text>
                    <Text style={[styles.subjectScore, { color: theme.text }]}>
                      {sub.correct}/{sub.total || 25} • <Text style={{ fontFamily: fonts.bold, color: theme.primary }}>{sub.accuracy}%</Text>
                    </Text>
                  </View>

                  <View style={[styles.progressTrack, { backgroundColor: theme.isDark ? "#1F2937" : "#E2E8F0" }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, sub.accuracy)}%`,
                          backgroundColor: sub.accuracy >= 80 ? "#16A34A" : sub.accuracy >= 60 ? "#CA8A04" : "#DC2626"
                        }
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Topic-Wise Analysis */}
          <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>
              {isHindi ? "टॉपिक-वार विश्लेषण" : "Topic-Wise Analysis"}
            </Text>

            <View style={styles.topicColumns}>
              {/* Weak Topics */}
              <View style={[styles.topicBox, { backgroundColor: theme.isDark ? "#7F1D1D15" : "#FEF2F2", borderColor: theme.isDark ? "#991B1B40" : "#FECACA" }]}>
                <View style={styles.topicBoxHeader}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#DC2626" />
                  <Text style={[styles.topicBoxTitle, { color: "#DC2626" }]}>
                    {isHindi ? "सुधार की आवश्यकता" : "Needs Improvement"}
                  </Text>
                </View>

                {weakTopics.map((top, idx) => (
                  <View key={idx} style={styles.topicRowItem}>
                    <Text style={[styles.topicName, { color: theme.text }]}>• {top.topicName}</Text>
                    <Text style={[styles.topicAccuracy, { color: "#DC2626" }]}>{top.accuracy}%</Text>
                  </View>
                ))}
              </View>

              {/* Strong Topics */}
              <View style={[styles.topicBox, { backgroundColor: theme.isDark ? "#064E3B15" : "#F0FDF4", borderColor: theme.isDark ? "#065F4640" : "#BBF7D0" }]}>
                <View style={styles.topicBoxHeader}>
                  <MaterialCommunityIcons name="check-circle-outline" size={14} color="#16A34A" />
                  <Text style={[styles.topicBoxTitle, { color: "#16A34A" }]}>
                    {isHindi ? "मजबूत विषय" : "Strong Topics"}
                  </Text>
                </View>

                {strongTopics.map((top, idx) => (
                  <View key={idx} style={styles.topicRowItem}>
                    <Text style={[styles.topicName, { color: theme.text }]}>✓ {top.topicName}</Text>
                    <Text style={[styles.topicAccuracy, { color: "#16A34A" }]}>{top.accuracy}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Targeted Weak-Topic Practice Loop */}
          <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.recommendHeader}>
              <View>
                <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>
                  {isHindi ? "अनुशंसित अभ्यास" : "Recommended Practice"}
                </Text>
                <Text style={[styles.recommendSub, { color: theme.subtext }]}>
                  {isHindi ? "अपने कमजोर क्षेत्रों में सुधार के लिए लक्षित अभ्यास करें।" : "Turn your weak areas into strengths with targeted practice sets."}
                </Text>
              </View>
            </View>

            <View style={styles.recommendGrid}>
              {weakTopics.map((top, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.recommendCard,
                    { backgroundColor: theme.isDark ? "#1E2937" : "#F8FAFC", borderColor: theme.border }
                  ]}
                >
                  <View style={styles.recCardLeft}>
                    <Text style={[styles.recTopicTitle, { color: theme.text }]}>{top.topicName}</Text>
                    <Text style={[styles.recTopicSub, { color: theme.subtext }]}>
                      {top.recommendedCount || 15} {isHindi ? "अभ्यास प्रश्न" : "Targeted Practice Questions"}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => onPracticeTopic && onPracticeTopic(top.topicName)}
                    style={({ pressed }) => [
                      styles.recBtn,
                      { backgroundColor: theme.primary },
                      pressed && { opacity: 0.88 }
                    ]}
                  >
                    <Text style={styles.recBtnText}>{isHindi ? "अभ्यास करें" : "Practice Now"}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </>
      ) : (
        /* Detailed Solutions View */
        <View style={styles.solutionsContainer}>
          <Text style={[styles.solutionSectionTitle, { color: theme.text }]}>
            {isHindi ? "प्रश्न एवं उत्तर कुंजी" : "Question Solutions"}
          </Text>

          {questions.map((q, idx) => {
            const qId = q.id || `q_${idx + 1}`;
            const userAns = userAnswers[qId]?.selectedOption;
            const isCorrect = userAns && String(userAns).toUpperCase() === String(q.correctAnswer).toUpperCase();
            const isSkipped = !userAns;
            const isSaved = savedQuestionIds.has(qId);

            const displayQText = isHindi && q.questionTextHi ? q.questionTextHi : q.questionText;
            const displayOptions = isHindi && q.optionsHi && q.optionsHi.length > 0 ? q.optionsHi : q.options;
            const displayExp = isHindi && q.explanationHi ? q.explanationHi : q.explanation;

            return (
              <View
                key={qId}
                style={[
                  styles.solutionCard,
                  { backgroundColor: theme.cardBg, borderColor: theme.border }
                ]}
              >
                <View style={styles.solCardHeader}>
                  <View style={styles.solHeaderLeft}>
                    <Text style={[styles.solQNum, { color: theme.text }]}>Q{idx + 1}.</Text>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isCorrect ? "#DCFCE7" : isSkipped ? "#F1F5F9" : "#FEE2E2"
                        }
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: isCorrect ? "#166534" : isSkipped ? "#475569" : "#991B1B" }
                        ]}
                      >
                        {isCorrect
                          ? (isHindi ? "सही ✓" : "Correct ✓")
                          : isSkipped
                          ? (isHindi ? "छोड़ा" : "Skipped")
                          : (isHindi ? "गलत ✗" : "Incorrect ✗")}
                      </Text>
                    </View>
                  </View>

                  <Pressable onPress={() => toggleSaveQuestion(qId)} style={styles.bookmarkBtn}>
                    <MaterialCommunityIcons
                      name={isSaved ? "bookmark" : "bookmark-outline"}
                      size={18}
                      color={isSaved ? "#EA580C" : theme.subtext}
                    />
                  </Pressable>
                </View>

                <Text style={[styles.solQText, { color: theme.text }]}>{displayQText}</Text>

                <View style={styles.solOptionsList}>
                  {displayOptions.map((opt) => {
                    const isUserPick = userAns === opt.label;
                    const isRightOpt = q.correctAnswer === opt.label;

                    let optBg = theme.isDark ? "#1F2937" : "#F8FAFC";
                    let optBorder = theme.border;
                    let labelColor = theme.text;

                    if (isRightOpt) {
                      optBg = theme.isDark ? "#064E3B25" : "#F0FDF4";
                      optBorder = "#16A34A";
                      labelColor = "#16A34A";
                    } else if (isUserPick && !isRightOpt) {
                      optBg = theme.isDark ? "#7F1D1D25" : "#FEF2F2";
                      optBorder = "#DC2626";
                      labelColor = "#DC2626";
                    }

                    return (
                      <View
                        key={opt.label}
                        style={[
                          styles.solOptionRow,
                          { backgroundColor: optBg, borderColor: optBorder }
                        ]}
                      >
                        <Text style={[styles.solOptionLabel, { color: labelColor }]}>({opt.label})</Text>
                        <Text style={[styles.solOptionText, { color: theme.text }]}>{opt.text}</Text>
                        {isRightOpt ? <Text style={{ color: "#16A34A", fontFamily: fonts.bold, fontSize: 11 }}>{isHindi ? "✓ सही उत्तर" : "✓ Correct"}</Text> : null}
                        {isUserPick && !isRightOpt ? <Text style={{ color: "#DC2626", fontFamily: fonts.bold, fontSize: 11 }}>{isHindi ? "आपका उत्तर" : "Your Answer"}</Text> : null}
                      </View>
                    );
                  })}
                </View>

                {/* Explanation Box */}
                <View style={[styles.expBox, { backgroundColor: theme.isDark ? "#1E2937" : "#F1F5F9" }]}>
                  <Text style={[styles.expTitle, { color: theme.text }]}>{isHindi ? "समाधान व्याख्या:" : "Solution Explanation:"}</Text>
                  <Text style={[styles.expText, { color: theme.subtext }]}>{displayExp || "No explanation provided."}</Text>
                </View>

                <View style={styles.solFooterRow}>
                  <Text style={[styles.solMeta, { color: theme.subtext }]}>
                    Topic: {q.topicName || "General"}
                  </Text>
                  <Pressable
                    onPress={() => onPracticeTopic && onPracticeTopic(q.topicName || "General")}
                    style={styles.practiceSimBtn}
                  >
                    <Text style={[styles.practiceSimText, { color: theme.primary }]}>{isHindi ? "अभ्यास करें →" : "Practice Similar →"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 12
  },
  headerCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  backText: {
    fontSize: 12,
    fontFamily: fonts.semiBold
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  badgeText: {
    fontSize: 9,
    fontFamily: fonts.bold
  },
  testTitle: {
    fontSize: 16,
    fontFamily: fonts.bold
  },
  testSub: {
    fontSize: 12,
    fontFamily: fonts.regular
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2
  },
  metricCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
    gap: 2
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: fonts.medium
  },
  metricValue: {
    fontSize: 15,
    fontFamily: fonts.bold
  },
  metricMax: {
    fontSize: 10,
    fontFamily: fonts.regular,
    color: "#64748B"
  },
  secondaryStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.2)"
  },
  subStat: {
    alignItems: "center"
  },
  subStatNum: {
    fontSize: 14,
    fontFamily: fonts.bold
  },
  subStatLabel: {
    fontSize: 10,
    fontFamily: fonts.regular
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8
  },
  primaryBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1
  },
  secondaryBtnText: {
    fontSize: 12,
    fontFamily: fonts.semiBold
  },
  aiCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8
  },
  aiHeader: {
    flexDirection: "row"
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14
  },
  aiBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold
  },
  aiMessage: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    lineHeight: 18
  },
  aiActionRow: {
    flexDirection: "row"
  },
  aiBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  aiBtnText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontFamily: fonts.bold
  },
  subjectList: {
    gap: 10
  },
  subjectItem: {
    gap: 4
  },
  subjectRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  subjectName: {
    fontSize: 12,
    fontFamily: fonts.semiBold
  },
  subjectScore: {
    fontSize: 11,
    fontFamily: fonts.medium
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 3
  },
  topicColumns: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap"
  },
  topicBox: {
    flex: 1,
    minWidth: 240,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 6
  },
  topicBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2
  },
  topicBoxTitle: {
    fontSize: 12,
    fontFamily: fonts.bold
  },
  topicRowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  topicName: {
    fontSize: 11.5,
    fontFamily: fonts.medium
  },
  topicAccuracy: {
    fontSize: 11,
    fontFamily: fonts.bold
  },
  recommendHeader: {
    marginBottom: 2
  },
  recommendSub: {
    fontSize: 11,
    fontFamily: fonts.regular,
    marginTop: 1
  },
  recommendGrid: {
    gap: 8
  },
  recommendCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  recCardLeft: {
    flex: 1,
    gap: 2
  },
  recTopicTitle: {
    fontSize: 13,
    fontFamily: fonts.bold
  },
  recTopicSub: {
    fontSize: 10.5,
    fontFamily: fonts.regular
  },
  recBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  recBtnText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  solutionsContainer: {
    gap: 10
  },
  solutionSectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold
  },
  solutionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8
  },
  solCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  solHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  solQNum: {
    fontSize: 14,
    fontFamily: fonts.bold
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: fonts.bold
  },
  bookmarkBtn: {
    padding: 3
  },
  solQText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    lineHeight: 18
  },
  solOptionsList: {
    gap: 6,
    marginVertical: 2
  },
  solOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1
  },
  solOptionLabel: {
    fontSize: 12,
    fontFamily: fonts.bold
  },
  solOptionText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.medium
  },
  expBox: {
    padding: 10,
    borderRadius: 8,
    gap: 3
  },
  expTitle: {
    fontSize: 11,
    fontFamily: fonts.bold
  },
  expText: {
    fontSize: 11.5,
    fontFamily: fonts.regular,
    lineHeight: 16
  },
  solFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2
  },
  solMeta: {
    fontSize: 10.5,
    fontFamily: fonts.medium
  },
  practiceSimBtn: {
    padding: 2
  },
  practiceSimText: {
    fontSize: 11,
    fontFamily: fonts.bold
  }
});
