import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../constants/fonts";
import QuestionPalette from "../components/mockTest/QuestionPalette";
import SubmitConfirmModal from "../components/mockTest/SubmitConfirmModal";
import ResultDashboard from "../components/mockTest/ResultDashboard";
import CustomTestGeneratorModal from "../components/mockTest/CustomTestGeneratorModal";
import {
  defaultGovExamsList,
  defaultMockTests,
  generateMockQuestions
} from "../components/mockTest/mockTestMockData";
import {
  getGovernmentMockTestDetails,
  getGovernmentMockTests,
  submitGovernmentMockTest
} from "../api/client";

const { width } = Dimensions.get("window");
const STORAGE_EXAM_KEY = "tcm_selected_exam_v1";

export default function MockTestScreen({
  onBack,
  onOpenGovPrep,
  user = {},
  session = {}
}) {
  const { theme } = useTheme();

  // Screen View Mode: "home" | "instructions" | "attempt" | "result"
  const [viewMode, setViewMode] = useState("home");

  // Selected Exam State
  const [selectedExam, setSelectedExam] = useState(defaultGovExamsList[0]);
  const [showExamSelectorModal, setShowExamSelectorModal] = useState(false);

  // Selected Language for Test: "en" | "hi"
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Category & Filter State
  const [activeCategory, setActiveCategory] = useState("Full Mock Test");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Tests & Attempt State
  const [testsList, setTestsList] = useState(defaultMockTests);
  const [activeTest, setActiveTest] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visitedSet, setVisitedSet] = useState(new Set([0]));

  // Attempt Timer & Submission
  const [remainingSeconds, setRemainingSeconds] = useState(3600);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);
  const [showCustomGenerator, setShowCustomGenerator] = useState(false);
  const [evaluatedResult, setEvaluatedResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isMobile = width < 768;
  const isHindi = selectedLanguage === "hi";

  // Restore Persisted Selected Exam
  useEffect(() => {
    async function loadSavedExam() {
      try {
        let stored = null;
        if (typeof window !== "undefined" && window.localStorage) {
          stored = window.localStorage.getItem(STORAGE_EXAM_KEY);
        }
        if (!stored) {
          stored = await AsyncStorage.getItem(STORAGE_EXAM_KEY);
        }
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            setSelectedExam(parsed);
          }
        }
      } catch (e) {}
    }
    loadSavedExam();
  }, []);

  // Fetch Tests for Selected Exam
  useEffect(() => {
    fetchMockTests();
  }, [selectedExam?.id]);

  async function fetchMockTests() {
    try {
      setIsLoading(true);
      const res = await getGovernmentMockTests({ examId: selectedExam?.id });
      if (res && res.success && Array.isArray(res.tests) && res.tests.length > 0) {
        setTestsList(res.tests);
      } else {
        const filteredFallback = defaultMockTests.filter(
          (t) => !t.examId || t.examId === selectedExam?.id
        );
        setTestsList(filteredFallback.length > 0 ? filteredFallback : defaultMockTests);
      }
    } catch (e) {
      setTestsList(defaultMockTests);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectExam(ex) {
    setSelectedExam(ex);
    setShowExamSelectorModal(false);
    try {
      const str = JSON.stringify(ex);
      AsyncStorage.setItem(STORAGE_EXAM_KEY, str).catch(() => {});
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_EXAM_KEY, str);
      }
    } catch (e) {}
  }

  // Handle Opening Test Instructions
  async function handleOpenTest(test) {
    setActiveTest(test);
    setIsLoading(true);
    try {
      const res = await getGovernmentMockTestDetails(test.id);
      if (res && res.success && res.test && Array.isArray(res.test.questions) && res.test.questions.length > 0) {
        setTestQuestions(res.test.questions);
      } else {
        setTestQuestions(generateMockQuestions(test.id, test.examName || selectedExam.name));
      }
    } catch (e) {
      setTestQuestions(generateMockQuestions(test.id, test.examName || selectedExam.name));
    } finally {
      setIsLoading(false);
      setViewMode("instructions");
    }
  }

  // Restore / Start Test Attempt
  async function handleStartOrResumeTest() {
    if (!activeTest) return;

    const testKey = `tcm_mock_attempt_${activeTest.id}`;
    let savedState = null;

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        savedState = window.localStorage.getItem(testKey);
      }
      if (!savedState) {
        savedState = await AsyncStorage.getItem(testKey);
      }
    } catch (e) {}

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed && parsed.answers) {
          setAnswers(parsed.answers || {});
          setVisitedSet(new Set(parsed.visitedIndices || [0]));
          setCurrentQIndex(parsed.currentQIndex || 0);
          setRemainingSeconds(parsed.remainingSeconds ?? (activeTest.durationMins * 60));
          if (parsed.selectedLanguage) setSelectedLanguage(parsed.selectedLanguage);
          setViewMode("attempt");
          setIsTimerRunning(true);
          return;
        }
      } catch (e) {}
    }

    // Fresh Attempt Initialization
    setAnswers({});
    setVisitedSet(new Set([0]));
    setCurrentQIndex(0);
    setRemainingSeconds((activeTest.durationMins || 60) * 60);
    setViewMode("attempt");
    setIsTimerRunning(true);
  }

  // CBT Timer Interval
  useEffect(() => {
    let timer = null;
    if (isTimerRunning && viewMode === "attempt" && remainingSeconds > 0) {
      timer = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsTimerRunning(false);
            handleFinalSubmit(); // Auto Submit safely when time reaches 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning, viewMode, remainingSeconds]);

  // Save Progress State
  function saveAttemptState(updatedAnswers, updatedVisited, nextIndex, nextSeconds, lang = selectedLanguage) {
    if (!activeTest) return;
    const testKey = `tcm_mock_attempt_${activeTest.id}`;
    const payload = JSON.stringify({
      answers: updatedAnswers,
      visitedIndices: Array.from(updatedVisited),
      currentQIndex: nextIndex,
      remainingSeconds: nextSeconds,
      selectedLanguage: lang
    });

    try {
      AsyncStorage.setItem(testKey, payload).catch(() => {});
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(testKey, payload);
      }
    } catch (e) {}
  }

  // Option Click Handler
  function handleSelectOption(optionLabel) {
    const q = testQuestions[currentQIndex];
    if (!q) return;
    const qId = q.id || `q_${currentQIndex + 1}`;

    const currentAns = answers[qId] || {};
    const updatedAns = {
      ...answers,
      [qId]: {
        ...currentAns,
        selectedOption: optionLabel,
        isAnswered: true
      }
    };

    setAnswers(updatedAns);
    saveAttemptState(updatedAns, visitedSet, currentQIndex, remainingSeconds);
  }

  // Clear Response
  function handleClearResponse() {
    const q = testQuestions[currentQIndex];
    if (!q) return;
    const qId = q.id || `q_${currentQIndex + 1}`;

    const updatedAns = { ...answers };
    if (updatedAns[qId]) {
      delete updatedAns[qId];
    }

    setAnswers(updatedAns);
    saveAttemptState(updatedAns, visitedSet, currentQIndex, remainingSeconds);
  }

  // Mark for Review & Next
  function handleMarkAndNext() {
    const q = testQuestions[currentQIndex];
    if (!q) return;
    const qId = q.id || `q_${currentQIndex + 1}`;

    const currentAns = answers[qId] || {};
    const updatedAns = {
      ...answers,
      [qId]: {
        ...currentAns,
        isMarked: true
      }
    };

    setAnswers(updatedAns);

    const nextIdx = Math.min(testQuestions.length - 1, currentQIndex + 1);
    const updatedVisited = new Set(visitedSet).add(nextIdx);
    setVisitedSet(updatedVisited);
    setCurrentQIndex(nextIdx);

    saveAttemptState(updatedAns, updatedVisited, nextIdx, remainingSeconds);
  }

  // Save & Next
  function handleSaveAndNext() {
    const nextIdx = Math.min(testQuestions.length - 1, currentQIndex + 1);
    const updatedVisited = new Set(visitedSet).add(nextIdx);
    setVisitedSet(updatedVisited);
    setCurrentQIndex(nextIdx);

    saveAttemptState(answers, updatedVisited, nextIdx, remainingSeconds);
  }

  // Question Direct Select from Palette
  function handlePaletteSelect(idx) {
    const updatedVisited = new Set(visitedSet).add(idx);
    setVisitedSet(updatedVisited);
    setCurrentQIndex(idx);
    saveAttemptState(answers, updatedVisited, idx, remainingSeconds);
  }

  // Final Submit Handler
  async function handleFinalSubmit() {
    setIsTimerRunning(false);
    setShowSubmitModal(false);

    let evalResult = null;
    const totalTimeSpent = ((activeTest?.durationMins || 60) * 60) - remainingSeconds;

    try {
      if (activeTest && activeTest.id) {
        const serverRes = await submitGovernmentMockTest(activeTest.id, {
          answers,
          timeTakenSec: totalTimeSpent
        });
        if (serverRes && serverRes.success && serverRes.result) {
          evalResult = serverRes.result;
        }
      }
    } catch (e) {}

    if (!evalResult) {
      // Local calculation fallback
      let correct = 0;
      let wrong = 0;
      let skipped = 0;
      let score = 0;

      testQuestions.forEach((q, idx) => {
        const qId = q.id || `q_${idx + 1}`;
        const userPick = answers[qId]?.selectedOption;
        if (!userPick) {
          skipped++;
        } else if (String(userPick).toUpperCase() === String(q.correctAnswer).toUpperCase()) {
          correct++;
          score += activeTest?.positiveMarks || 2.0;
        } else {
          wrong++;
          score -= activeTest?.negativeMarking || 0.5;
        }
      });

      const totalQs = testQuestions.length || 1;
      const attemptedCount = correct + wrong;
      const accuracy = attemptedCount > 0 ? Math.round((correct / attemptedCount) * 100) : 0;
      const maxScore = activeTest?.maxMarks || (totalQs * (activeTest?.positiveMarks || 2.0));

      evalResult = {
        score: Math.max(0, Math.round(score * 100) / 100),
        maxScore,
        accuracy,
        attempted: attemptedCount,
        correct,
        wrong,
        skipped,
        totalQuestions: totalQs,
        timeTakenSec: totalTimeSpent
      };
    }

    setTestsList((prev) =>
      prev.map((t) =>
        t.id === activeTest.id
          ? {
              ...t,
              status: "Completed",
              lastAttempt: {
                score: evalResult.score,
                maxScore: evalResult.maxScore,
                accuracy: evalResult.accuracy
              }
            }
          : t
      )
    );

    setEvaluatedResult(evalResult);
    setViewMode("result");

    if (activeTest) {
      const testKey = `tcm_mock_attempt_${activeTest.id}`;
      AsyncStorage.removeItem(testKey).catch(() => {});
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(testKey);
      }
    }
  }

  // Filtered Test List
  const filteredTests = testsList.filter((test) => {
    if (activeCategory === "Full Mock Test" && test.testType !== "full") return false;
    if (activeCategory === "Subject Tests" && test.testType !== "subject") return false;
    if (activeCategory === "Topic Tests" && test.testType !== "topic") return false;
    if (activeCategory === "Previous Year Tests" && test.testType !== "pyq") return false;

    if (difficultyFilter !== "All" && test.difficulty !== difficultyFilter) return false;
    if (statusFilter !== "All" && test.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return String(test.title).toLowerCase().includes(q) || String(test.examName).toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate current attempt counts for submit modal
  let answeredCount = 0;
  let notAnsweredCount = 0;
  let markedCount = 0;
  let notVisitedCount = 0;

  testQuestions.forEach((q, idx) => {
    const qId = q.id || `q_${idx + 1}`;
    const ans = answers[qId] || {};
    const isVisited = visitedSet.has(idx);
    if (ans.selectedOption) {
      answeredCount++;
    } else if (ans.isMarked) {
      markedCount++;
    } else if (isVisited) {
      notAnsweredCount++;
    } else {
      notVisitedCount++;
    }
  });

  // Format timer text (e.g. 42:18)
  const timerMins = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const timerSecs = String(remainingSeconds % 60).padStart(2, "0");
  const isTimerLow = remainingSeconds <= 300;

  // ----------------------------------------------------
  // RENDER VIEW MODE 1: DASHBOARD HOME
  // ----------------------------------------------------
  if (viewMode === "home") {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeScroll}>
          {/* Header Bar */}
          <View style={[styles.topHeader, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.topHeaderLeft}>
              <Pressable onPress={onBack} style={styles.backBtn}>
                <Feather name="arrow-left" size={18} color={theme.text} />
              </Pressable>

              <View style={{ flex: 1 }}>
                <View style={styles.examTitleRow}>
                  <Text style={[styles.examTitleText, { color: theme.text }]} numberOfLines={1}>
                    {selectedExam.name} Mock Tests
                  </Text>

                  {/* Compact Exam Switcher Button */}
                  <Pressable
                    onPress={() => setShowExamSelectorModal(true)}
                    style={({ pressed }) => [
                      styles.examSwitchPill,
                      { backgroundColor: theme.isDark ? "#1E2937" : "#EFF6FF", borderColor: theme.border },
                      pressed && { opacity: 0.8 }
                    ]}
                  >
                    <MaterialCommunityIcons name="swap-horizontal" size={12} color={theme.primary} />
                    <Text style={[styles.examSwitchText, { color: theme.primary }]}>Change</Text>
                  </Pressable>
                </View>

                <Text style={[styles.examSubText, { color: theme.subtext }]} numberOfLines={1}>
                  Practice, analyze and improve your preparation.
                </Text>
              </View>
            </View>
          </View>

          {/* Primary Category Selector Tabs */}
          <View style={styles.categoryBar}>
            {["Full Mock Test", "Subject Tests", "Topic Tests", "Previous Year Tests", "Custom Practice"].map((cat) => {
              const active = activeCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => {
                    if (cat === "Custom Practice") {
                      setShowCustomGenerator(true);
                    } else {
                      setActiveCategory(cat);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.catChip,
                    {
                      backgroundColor: active ? theme.primary : theme.cardBg,
                      borderColor: active ? theme.primary : theme.border
                    },
                    pressed && { opacity: 0.85 }
                  ]}
                >
                  <Text style={[styles.catChipText, { color: active ? "#FFFFFF" : theme.text }]}>{cat}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Quick Filters Toolbar */}
          <View style={[styles.filterBar, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.searchRow}>
              <Feather name="search" size={14} color={theme.subtext} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search mock tests..."
                placeholderTextColor={theme.subtext}
                style={[styles.searchInput, { color: theme.text }]}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={12} color={theme.subtext} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.filterChipRow}>
              {["All", "Easy", "Medium", "Hard"].map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDifficultyFilter(d)}
                  style={[
                    styles.subFilterChip,
                    {
                      backgroundColor: difficultyFilter === d ? (theme.isDark ? "#1E2937" : "#E2E8F0") : "transparent",
                      borderColor: theme.border
                    }
                  ]}
                >
                  <Text style={[styles.subFilterText, { color: theme.text }]}>{d}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Test Listing Grid */}
          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.subtext }]}>Loading {selectedExam.name} Mock Tests...</Text>
            </View>
          ) : filteredTests.length > 0 ? (
            <View style={styles.testGrid}>
              {filteredTests.map((test) => {
                const isCompleted = test.status === "Completed";
                const isInProgress = test.status === "In Progress";

                return (
                  <View
                    key={test.id}
                    style={[styles.testCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
                  >
                    <View style={styles.testCardHeader}>
                      <View style={[styles.testTypeBadge, { backgroundColor: theme.isDark ? "#1E2937" : "#EFF6FF" }]}>
                        <Text style={[styles.testTypeBadgeText, { color: theme.primary }]}>
                          {test.tier || test.testType.toUpperCase()}
                        </Text>
                      </View>

                      <Text style={[styles.difficultyText, { color: theme.subtext }]}>
                        Difficulty: {test.difficulty || "Mixed"}
                      </Text>
                    </View>

                    <Text style={[styles.testCardTitle, { color: theme.text }]}>{test.title}</Text>

                    {/* Specs Row */}
                    <View style={styles.specsRow}>
                      <View style={styles.specItem}>
                        <MaterialCommunityIcons name="help-circle-outline" size={13} color={theme.subtext} />
                        <Text style={[styles.specText, { color: theme.subtext }]}>{test.totalQuestions} Questions</Text>
                      </View>

                      <View style={styles.specItem}>
                        <MaterialCommunityIcons name="clock-outline" size={13} color={theme.subtext} />
                        <Text style={[styles.specText, { color: theme.subtext }]}>{test.durationMins} Mins</Text>
                      </View>

                      <View style={styles.specItem}>
                        <MaterialCommunityIcons name="translate" size={13} color={theme.subtext} />
                        <Text style={[styles.specText, { color: theme.subtext }]}>English / हिंदी</Text>
                      </View>
                    </View>

                    {/* Attempted Scores (if completed) */}
                    {isCompleted && test.lastAttempt ? (
                      <View style={[styles.scoreSummaryBox, { backgroundColor: theme.isDark ? "#064E3B20" : "#F0FDF4", borderColor: "#16A34A" }]}>
                        <Text style={[styles.scoreSummaryText, { color: "#16A34A" }]}>
                          Score: {test.lastAttempt.score}/{test.maxMarks || 200} • Accuracy: {test.lastAttempt.accuracy}%
                        </Text>
                      </View>
                    ) : null}

                    {/* Footer CTA */}
                    <View style={styles.testCardFooter}>
                      <Pressable
                        onPress={() => {
                          if (isCompleted) {
                            setActiveTest(test);
                            setViewMode("result");
                          } else {
                            handleOpenTest(test);
                          }
                        }}
                        style={({ pressed }) => [
                          styles.startBtn,
                          {
                            backgroundColor: isCompleted ? (theme.isDark ? "#1F2937" : "#F1F5F9") : theme.primary,
                            borderColor: isCompleted ? theme.border : theme.primary,
                            borderWidth: isCompleted ? 1 : 0
                          },
                          pressed && { opacity: 0.88 }
                        ]}
                      >
                        <Text
                          style={[
                            styles.startBtnText,
                            { color: isCompleted ? theme.text : "#FFFFFF" }
                          ]}
                        >
                          {isCompleted ? "View Analysis" : isInProgress ? "Resume Test →" : "Start Test →"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="file-search-outline" size={28} color={theme.subtext} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Mock Tests Found</Text>
              <Text style={[styles.emptySub, { color: theme.subtext }]}>
                No tests match your selected criteria for {selectedExam.name}. Try changing filters or generate a custom practice test.
              </Text>
              <Pressable
                onPress={() => setShowCustomGenerator(true)}
                style={[styles.customGenBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 12 }}>Create Custom Test →</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Compact Exam Selector Modal */}
        <Modal visible={showExamSelectorModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.examModalCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.examModalHeader}>
                <Text style={[styles.examModalTitle, { color: theme.text }]}>Select Target Exam</Text>
                <Pressable onPress={() => setShowExamSelectorModal(false)}>
                  <Feather name="x" size={18} color={theme.subtext} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 320 }}>
                {defaultGovExamsList.map((ex) => {
                  const isSelected = selectedExam.id === ex.id;
                  return (
                    <Pressable
                      key={ex.id}
                      onPress={() => handleSelectExam(ex)}
                      style={[
                        styles.examSelectItem,
                        {
                          backgroundColor: isSelected ? (theme.isDark ? "#1E2937" : "#F1F5F9") : "transparent",
                          borderColor: theme.border
                        }
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.examSelectItemTitle, { color: theme.text }]}>{ex.name}</Text>
                        <Text style={[styles.examSelectItemSub, { color: theme.subtext }]}>{ex.category} • {ex.badge}</Text>
                      </View>
                      {isSelected ? <Feather name="check" size={16} color={theme.primary} /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Custom Practice Generator Modal */}
        <CustomTestGeneratorModal
          visible={showCustomGenerator}
          selectedExamName={selectedExam.name}
          selectedLanguage={selectedLanguage}
          onClose={() => setShowCustomGenerator(false)}
          onGenerate={(customTest) => {
            setShowCustomGenerator(false);
            setTestsList((prev) => [customTest, ...prev]);
            handleOpenTest(customTest);
          }}
        />
      </View>
    );
  }

  // ----------------------------------------------------
  // RENDER VIEW MODE 2: TEST INSTRUCTIONS SCREEN
  // ----------------------------------------------------
  if (viewMode === "instructions") {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <ScrollView contentContainerStyle={styles.instructionScroll}>
          <Pressable onPress={() => setViewMode("home")} style={styles.backBtnRow}>
            <Feather name="arrow-left" size={14} color={theme.subtext} />
            <Text style={[styles.backText, { color: theme.subtext }]}>Back to Mock Tests</Text>
          </Pressable>

          <View style={[styles.instructionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {/* Header + Language Switcher */}
            <View style={styles.instHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.instTitle, { color: theme.text }]}>{activeTest?.title}</Text>
                <Text style={[styles.instExam, { color: theme.subtext }]}>{activeTest?.examName || selectedExam.name} • Official CBT Examination</Text>
              </View>

              {/* Language Selector Pill */}
              <View style={[styles.langToggleBox, { backgroundColor: theme.isDark ? "#1E2937" : "#F1F5F9", borderColor: theme.border }]}>
                <Pressable
                  onPress={() => setSelectedLanguage("en")}
                  style={[styles.langBtn, selectedLanguage === "en" && { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.langText, { color: selectedLanguage === "en" ? "#FFFFFF" : theme.text }]}>EN</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedLanguage("hi")}
                  style={[styles.langBtn, selectedLanguage === "hi" && { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.langText, { color: selectedLanguage === "hi" ? "#FFFFFF" : theme.text }]}>हिन्दी</Text>
                </Pressable>
              </View>
            </View>

            {/* Test Specs Bar - Sleek Compact Banner */}
            <View style={[styles.sleekSpecsBar, { backgroundColor: theme.isDark ? "#1E2937" : "#F8FAFC", borderColor: theme.border }]}>
              <View style={styles.sleekSpecItem}>
                <MaterialCommunityIcons name="help-circle-outline" size={13} color={theme.primary} />
                <Text style={[styles.sleekSpecLabel, { color: theme.subtext }]}>{isHindi ? "प्रश्न:" : "Questions:"}</Text>
                <Text style={[styles.sleekSpecVal, { color: theme.text }]}>{activeTest?.totalQuestions || 100}</Text>
              </View>
              <Text style={[styles.sleekDivider, { color: theme.subtext }]}>•</Text>

              <View style={styles.sleekSpecItem}>
                <MaterialCommunityIcons name="clock-outline" size={13} color={theme.primary} />
                <Text style={[styles.sleekSpecLabel, { color: theme.subtext }]}>{isHindi ? "समय:" : "Duration:"}</Text>
                <Text style={[styles.sleekSpecVal, { color: theme.text }]}>{activeTest?.durationMins || 60} {isHindi ? "मिनट" : "Mins"}</Text>
              </View>
              <Text style={[styles.sleekDivider, { color: theme.subtext }]}>•</Text>

              <View style={styles.sleekSpecItem}>
                <MaterialCommunityIcons name="trophy-outline" size={13} color={theme.primary} />
                <Text style={[styles.sleekSpecLabel, { color: theme.subtext }]}>{isHindi ? "अंक:" : "Marks:"}</Text>
                <Text style={[styles.sleekSpecVal, { color: theme.text }]}>{activeTest?.maxMarks || 200}</Text>
              </View>
              <Text style={[styles.sleekDivider, { color: theme.subtext }]}>•</Text>

              <View style={styles.sleekSpecItem}>
                <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#DC2626" />
                <Text style={[styles.sleekSpecLabel, { color: theme.subtext }]}>{isHindi ? "माइनस:" : "Negative:"}</Text>
                <Text style={[styles.sleekSpecVal, { color: "#DC2626" }]}>-{activeTest?.negativeMarking || 0.50}</Text>
              </View>
            </View>

            {/* Status Legend Description */}
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              {isHindi ? "प्रश्न स्थिति (CBT Legend):" : "Question Palette Legend:"}
            </Text>
            <View style={styles.compactLegendGrid}>
              <View style={styles.legendGuideItem}>
                <View style={[styles.legendBoxMini, { backgroundColor: "#16A34A" }]} />
                <Text style={[styles.legendGuideText, { color: theme.text }]}>
                  {isHindi ? "उत्तर दिया (Answered)" : "Answered — Saved & Evaluated"}
                </Text>
              </View>

              <View style={styles.legendGuideItem}>
                <View style={[styles.legendBoxMini, { backgroundColor: "#DC2626" }]} />
                <Text style={[styles.legendGuideText, { color: theme.text }]}>
                  {isHindi ? "उत्तर नहीं दिया (Not Answered)" : "Not Answered — Visited without option"}
                </Text>
              </View>

              <View style={styles.legendGuideItem}>
                <View style={[styles.legendBoxMini, { backgroundColor: theme.isDark ? "#1F2937" : "#E2E8F0" }]} />
                <Text style={[styles.legendGuideText, { color: theme.text }]}>
                  {isHindi ? "देखा नहीं (Not Visited)" : "Not Visited — Not opened yet"}
                </Text>
              </View>

              <View style={styles.legendGuideItem}>
                <View style={[styles.legendBoxMini, { backgroundColor: "#9333EA" }]} />
                <Text style={[styles.legendGuideText, { color: theme.text }]}>
                  {isHindi ? "समीक्षा हेतु (Marked for Review)" : "Marked for Review — Flagged"}
                </Text>
              </View>
            </View>

            {/* General Instructions */}
            <Text style={[styles.sectionHeading, { color: theme.text }]}>
              {isHindi ? "महत्वपूर्ण परीक्षा निर्देश:" : "Important Exam Instructions:"}
            </Text>
            <View style={styles.rulesList}>
              <Text style={[styles.ruleText, { color: theme.subtext }]}>
                {isHindi
                  ? "1. टाइमर ऊपरी दाएं कोने में चलेगा। समय समाप्त होने पर टेस्ट स्वतः सबमिट हो जाएगा।"
                  : "1. The countdown timer at the top right corner displays the remaining time available."}
              </Text>
              <Text style={[styles.ruleText, { color: theme.subtext }]}>
                {isHindi
                  ? "2. [सहेजें और अगला / Save & Next] पर क्लिक करने पर आपका उत्तर सुरक्षित होगा।"
                  : "2. Click [Save & Next] to save your answer and proceed to the next question."}
              </Text>
              <Text style={[styles.ruleText, { color: theme.subtext }]}>
                {isHindi
                  ? "3. आप परीक्षा के दौरान कभी भी भाषा (EN / हिन्दी) बदल सकते हैं।"
                  : "3. You can toggle language anytime during the exam between English and Hindi."}
              </Text>
              <Text style={[styles.ruleText, { color: theme.subtext }]}>
                {isHindi
                  ? "4. टाइमर केवल आपके [परीक्षा शुरू करें] बटन दबाने के बाद शुरू होगा।"
                  : "4. Timer will start only after you click the [Start Test] button below."}
              </Text>
            </View>

            {/* Start CTA */}
            <View style={styles.startCtaWrapper}>
              <Pressable
                onPress={handleStartOrResumeTest}
                style={({ pressed }) => [
                  styles.startTestPrimaryBtn,
                  { backgroundColor: theme.primary },
                  pressed && { opacity: 0.88 }
                ]}
              >
                <Text style={styles.startTestPrimaryText}>
                  {isHindi ? "परीक्षा शुरू करें → Start Test" : "I am ready to begin → Start Test"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ----------------------------------------------------
  // RENDER VIEW MODE 3: REAL CBT ATTEMPT INTERFACE
  // ----------------------------------------------------
  if (viewMode === "attempt") {
    const currentQ = testQuestions[currentQIndex] || testQuestions[0];
    const qId = currentQ?.id || `q_${currentQIndex + 1}`;
    const selectedOption = answers[qId]?.selectedOption;

    const displayQText = isHindi && currentQ.questionTextHi ? currentQ.questionTextHi : currentQ.questionText;
    const displayOptions = isHindi && currentQ.optionsHi && currentQ.optionsHi.length > 0 ? currentQ.optionsHi : currentQ.options;
    const displaySecName = isHindi && currentQ.sectionNameHi ? currentQ.sectionNameHi : (currentQ.sectionName || "Section");

    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        {/* CBT Sticky Compact Header */}
        <View style={[styles.cbtHeader, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.cbtHeaderLeft}>
            <Text style={[styles.cbtTestTitle, { color: theme.text }]} numberOfLines={1}>
              {activeTest?.title}
            </Text>
            <Text style={[styles.cbtQProgressText, { color: theme.subtext }]} numberOfLines={1}>
              {displaySecName} • {isHindi ? "प्रश्न" : "Q"} {currentQIndex + 1}/{testQuestions.length}
            </Text>
          </View>

          <View style={styles.cbtHeaderRight}>
            {/* Language Switcher Pill */}
            <View style={[styles.langToggleBox, { backgroundColor: theme.isDark ? "#1E2937" : "#F1F5F9", borderColor: theme.border }]}>
              <Pressable
                onPress={() => setSelectedLanguage("en")}
                style={[styles.langBtn, selectedLanguage === "en" && { backgroundColor: theme.primary }]}
              >
                <Text style={[styles.langText, { color: selectedLanguage === "en" ? "#FFFFFF" : theme.text }]}>EN</Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedLanguage("hi")}
                style={[styles.langBtn, selectedLanguage === "hi" && { backgroundColor: theme.primary }]}
              >
                <Text style={[styles.langText, { color: selectedLanguage === "hi" ? "#FFFFFF" : theme.text }]}>हिन्दी</Text>
              </Pressable>
            </View>

            {/* Timer Display */}
            <View style={[styles.timerBox, { backgroundColor: isTimerLow ? "#FEF2F2" : theme.isDark ? "#1E2937" : "#F8FAFC", borderColor: isTimerLow ? "#DC2626" : theme.border }]}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={isTimerLow ? "#DC2626" : theme.primary} />
              <Text style={[styles.timerText, { color: isTimerLow ? "#DC2626" : theme.text }]}>
                {timerMins}:{timerSecs}
              </Text>
            </View>

            <Pressable
              onPress={() => setShowSubmitModal(true)}
              style={({ pressed }) => [
                styles.cbtSubmitBtn,
                { backgroundColor: "#DC2626" },
                pressed && { opacity: 0.88 }
              ]}
            >
              <Text style={styles.cbtSubmitBtnText}>{isHindi ? "सबमिट" : "Submit"}</Text>
            </Pressable>
          </View>
        </View>

        {/* CBT Body Area */}
        <View style={styles.cbtBodyRow}>
          {/* Main Question Scroll Area */}
          <ScrollView contentContainerStyle={styles.cbtQuestionScroll}>
            {currentQ ? (
              <View style={[styles.cbtQuestionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.cbtQHeader}>
                  <Text style={[styles.cbtQNumText, { color: theme.text }]}>
                    {isHindi ? `प्रश्न ${currentQIndex + 1}` : `Question ${currentQIndex + 1}`}
                  </Text>
                  <View style={[styles.marksBadge, { backgroundColor: theme.isDark ? "#1E2937" : "#F1F5F9" }]}>
                    <Text style={[styles.marksBadgeText, { color: theme.subtext }]}>
                      +{currentQ.positiveMarks || 2.0} / -{currentQ.negativeMarks || 0.5}
                    </Text>
                  </View>
                </View>

                {/* Question Text */}
                <Text style={[styles.cbtQuestionText, { color: theme.text }]}>
                  {displayQText}
                </Text>

                {/* Options List */}
                <View style={styles.optionsList}>
                  {displayOptions.map((opt) => {
                    const isSelected = selectedOption === opt.label;
                    return (
                      <Pressable
                        key={opt.label}
                        onPress={() => handleSelectOption(opt.label)}
                        style={({ pressed }) => [
                          styles.optionCard,
                          {
                            backgroundColor: isSelected
                              ? (theme.isDark ? "#064E3B30" : "#F0FDF4")
                              : (theme.isDark ? "#1E2937" : "#FFFFFF"),
                            borderColor: isSelected ? "#16A34A" : theme.border
                          },
                          pressed && { opacity: 0.9 }
                        ]}
                      >
                        <View style={[styles.radioCircle, { borderColor: isSelected ? "#16A34A" : theme.subtext }]}>
                          {isSelected ? <View style={styles.radioInner} /> : null}
                        </View>
                        <Text style={[styles.optLabel, { color: isSelected ? "#16A34A" : theme.text }]}>
                          ({opt.label})
                        </Text>
                        <Text style={[styles.optText, { color: theme.text }]}>
                          {opt.text}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Desktop Action Buttons Bar */}
            <View style={styles.cbtActionsBar}>
              <Pressable
                onPress={handleClearResponse}
                style={({ pressed }) => [
                  styles.actBtnSecondary,
                  { borderColor: theme.border, backgroundColor: theme.isDark ? "#1F2937" : "#FFFFFF" },
                  pressed && { opacity: 0.85 }
                ]}
              >
                <Text style={[styles.actBtnSecondaryText, { color: theme.text }]}>
                  {isHindi ? "उत्तर हटाएं" : "Clear Response"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleMarkAndNext}
                style={({ pressed }) => [
                  styles.actBtnPurple,
                  { backgroundColor: "#9333EA" },
                  pressed && { opacity: 0.88 }
                ]}
              >
                <Text style={styles.actBtnPurpleText}>
                  {isHindi ? "मार्क करें और अगला" : "Mark & Next"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSaveAndNext}
                style={({ pressed }) => [
                  styles.actBtnPrimary,
                  { backgroundColor: theme.primary },
                  pressed && { opacity: 0.88 }
                ]}
              >
                <Text style={styles.actBtnPrimaryText}>
                  {isHindi ? "सहेजें और अगला →" : "Save & Next →"}
                </Text>
              </Pressable>
            </View>

            {/* Mobile Questions Palette Opener Button */}
            {isMobile ? (
              <Pressable
                onPress={() => setShowPaletteDrawer(true)}
                style={[styles.mobilePaletteBtn, { backgroundColor: theme.isDark ? "#1F2937" : "#F1F5F9", borderColor: theme.border }]}
              >
                <MaterialCommunityIcons name="view-grid-outline" size={16} color={theme.text} />
                <Text style={[styles.mobilePaletteBtnText, { color: theme.text }]}>
                  {isHindi ? `प्रश्न पैलेट (${answeredCount}/${testQuestions.length})` : `Questions Palette (${answeredCount}/${testQuestions.length})`}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>

          {/* Desktop Question Palette Sidebar */}
          {!isMobile ? (
            <View style={styles.desktopPaletteWrap}>
              <QuestionPalette
                questions={testQuestions}
                currentIndex={currentQIndex}
                answers={answers}
                visitedSet={visitedSet}
                selectedLanguage={selectedLanguage}
                onSelectQuestion={handlePaletteSelect}
              />
            </View>
          ) : null}
        </View>

        {/* Mobile Palette Bottom Sheet Drawer */}
        <Modal visible={showPaletteDrawer} transparent animationType="slide">
          <View style={styles.mobileDrawerOverlay}>
            <View style={[styles.mobileDrawerCard, { backgroundColor: theme.cardBg }]}>
              <QuestionPalette
                questions={testQuestions}
                currentIndex={currentQIndex}
                answers={answers}
                visitedSet={visitedSet}
                selectedLanguage={selectedLanguage}
                onSelectQuestion={handlePaletteSelect}
                onCloseMobile={() => setShowPaletteDrawer(false)}
              />
            </View>
          </View>
        </Modal>

        {/* Safety Submit Confirmation Modal */}
        <SubmitConfirmModal
          visible={showSubmitModal}
          testTitle={activeTest?.title}
          answeredCount={answeredCount}
          notAnsweredCount={notAnsweredCount}
          notVisitedCount={notVisitedCount}
          markedCount={markedCount}
          selectedLanguage={selectedLanguage}
          onContinue={() => setShowSubmitModal(false)}
          onSubmit={handleFinalSubmit}
        />
      </View>
    );
  }

  // ----------------------------------------------------
  // RENDER VIEW MODE 4: RESULT DASHBOARD & ANALYTICS
  // ----------------------------------------------------
  if (viewMode === "result") {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <ResultDashboard
          result={evaluatedResult || {}}
          testTitle={activeTest?.title || "Mock Test"}
          questions={testQuestions}
          userAnswers={answers}
          selectedLanguage={selectedLanguage}
          onRetest={() => {
            setViewMode("instructions");
          }}
          onPracticeTopic={(topicName) => {
            if (onOpenGovPrep) {
              onOpenGovPrep(topicName);
            } else {
              Alert.alert("Targeted Practice", `Launching targeted practice questions for ${topicName}...`);
            }
          }}
          onGoHome={() => setViewMode("home")}
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%"
  },
  homeScroll: {
    padding: 12,
    gap: 12
  },
  topHeader: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1
  },
  topHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  backBtn: {
    padding: 2
  },
  examTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  examTitleText: {
    fontSize: 16,
    fontFamily: fonts.bold
  },
  examSwitchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1
  },
  examSwitchText: {
    fontSize: 10,
    fontFamily: fonts.bold
  },
  examSubText: {
    fontSize: 11.5,
    fontFamily: fonts.regular,
    marginTop: 1
  },
  categoryBar: {
    flexDirection: "row",
    gap: 6,
    overflow: "scroll"
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1
  },
  catChipText: {
    fontSize: 12,
    fontFamily: fonts.bold
  },
  filterBar: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.medium
  },
  filterChipRow: {
    flexDirection: "row",
    gap: 5
  },
  subFilterChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1
  },
  subFilterText: {
    fontSize: 10.5,
    fontFamily: fonts.medium
  },
  loadingBox: {
    padding: 30,
    alignItems: "center",
    gap: 10
  },
  loadingText: {
    fontSize: 12,
    fontFamily: fonts.medium
  },
  testGrid: {
    gap: 12
  },
  testCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8
  },
  testCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  testTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  testTypeBadgeText: {
    fontSize: 9.5,
    fontFamily: fonts.bold
  },
  difficultyText: {
    fontSize: 10.5,
    fontFamily: fonts.medium
  },
  testCardTitle: {
    fontSize: 14.5,
    fontFamily: fonts.bold
  },
  specsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },
  specText: {
    fontSize: 11,
    fontFamily: fonts.medium
  },
  scoreSummaryBox: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1
  },
  scoreSummaryText: {
    fontSize: 11,
    fontFamily: fonts.bold
  },
  testCardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 2
  },
  startBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6
  },
  startBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold
  },
  emptyBox: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    textAlign: "center",
    gap: 8
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.bold
  },
  emptySub: {
    fontSize: 11.5,
    fontFamily: fonts.regular,
    textAlign: "center"
  },
  customGenBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  examModalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10
  },
  examModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  examModalTitle: {
    fontSize: 16,
    fontFamily: fonts.bold
  },
  examSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6
  },
  examSelectItemTitle: {
    fontSize: 13,
    fontFamily: fonts.bold
  },
  examSelectItemSub: {
    fontSize: 10.5,
    fontFamily: fonts.regular
  },
  instructionScroll: {
    padding: 12,
    gap: 10
  },
  backBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  backText: {
    fontSize: 12,
    fontFamily: fonts.semiBold
  },
  instructionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12
  },
  instHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  instTitle: {
    fontSize: 17,
    fontFamily: fonts.bold
  },
  instExam: {
    fontSize: 12,
    fontFamily: fonts.medium
  },
  langToggleBox: {
    flexDirection: "row",
    padding: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  langText: {
    fontSize: 10,
    fontFamily: fonts.bold
  },
  instSpecsGrid: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 4
  },
  instSpecBox: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    alignItems: "center",
    gap: 1
  },
  instSpecLabel: {
    fontSize: 9.5,
    fontFamily: fonts.medium
  },
  instSpecValue: {
    fontSize: 13.5,
    fontFamily: fonts.bold
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: fonts.bold,
    marginTop: 4
  },
  legendGuideBox: {
    gap: 6
  },
  legendGuideItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  legendBoxMini: {
    width: 12,
    height: 12,
    borderRadius: 3
  },
  legendGuideText: {
    fontSize: 11,
    fontFamily: fonts.medium
  },
  rulesList: {
    gap: 4
  },
  ruleText: {
    fontSize: 11.5,
    fontFamily: fonts.regular,
    lineHeight: 16
  },
  sleekSpecsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
    gap: 4
  },
  sleekSpecItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  sleekSpecLabel: {
    fontSize: 10.5,
    fontFamily: fonts.medium
  },
  sleekSpecVal: {
    fontSize: 11.5,
    fontFamily: fonts.bold
  },
  sleekDivider: {
    fontSize: 10,
    opacity: 0.4
  },
  compactLegendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 2
  },
  startCtaWrapper: {
    alignItems: "center",
    marginTop: 4
  },
  startTestPrimaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  startTestPrimaryText: {
    fontSize: 12.5,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  cbtHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1
  },
  cbtHeaderLeft: {
    flex: 1,
    gap: 1,
    paddingRight: 6
  },
  cbtTestTitle: {
    fontSize: 13.5,
    fontFamily: fonts.bold
  },
  cbtQProgressText: {
    fontSize: 10.5,
    fontFamily: fonts.medium
  },
  cbtHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  timerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1
  },
  timerText: {
    fontSize: 12.5,
    fontFamily: fonts.bold
  },
  cbtSubmitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6
  },
  cbtSubmitBtnText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  cbtBodyRow: {
    flex: 1,
    flexDirection: "row"
  },
  cbtQuestionScroll: {
    flexGrow: 1,
    padding: 12,
    gap: 12
  },
  cbtQuestionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10
  },
  cbtQHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  cbtQNumText: {
    fontSize: 14.5,
    fontFamily: fonts.bold
  },
  marksBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  marksBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold
  },
  cbtQuestionText: {
    fontSize: 13.5,
    fontFamily: fonts.semiBold,
    lineHeight: 20
  },
  optionsList: {
    gap: 8,
    marginTop: 4
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A"
  },
  optLabel: {
    fontSize: 12,
    fontFamily: fonts.bold
  },
  optText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: fonts.medium
  },
  cbtActionsBar: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  actBtnSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center"
  },
  actBtnSecondaryText: {
    fontSize: 11.5,
    fontFamily: fonts.bold
  },
  actBtnPurple: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center"
  },
  actBtnPurpleText: {
    fontSize: 11.5,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  actBtnPrimary: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 110
  },
  actBtnPrimaryText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: "#FFFFFF"
  },
  mobilePaletteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4
  },
  mobilePaletteBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold
  },
  desktopPaletteWrap: {
    width: 250,
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(150, 150, 150, 0.2)"
  },
  mobileDrawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end"
  },
  mobileDrawerCard: {
    height: "70%",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 12
  }
});
