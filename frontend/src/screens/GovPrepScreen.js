import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Pressable,
  Dimensions
} from "react-native";
import { MaterialCommunityIcons, Feather, FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { fonts } from "../constants/fonts";
import { shadow } from "../constants/theme";
import {
  getGovCategories,
  getGovExams,
  getGovYears,
  getGovSubjects,
  getGovTopics,
  getGovQuestionCount,
  getGovRandomQuestions,
  getGovQuestions,
  attemptGovQuestion,
  saveGovQuestion,
  getSavedGovQuestions,
  getGovProgress,
  explainGovQuestionWithAI
} from "../api/client";

const { width } = Dimensions.get("window");

export default function GovPrepScreen({ session, user, onBack }) {
  const { theme } = useTheme();

  // Primary Data State
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");

  const [allExams, setAllExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);

  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [questionCountLimit, setQuestionCountLimit] = useState("20");
  const [availableCount, setAvailableCount] = useState(0);

  // Practice State
  const [inPractice, setInPractice] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Current Question Selection
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  // AI Explanation State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLanguage, setAiLanguage] = useState("en");
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [followUpResponses, setFollowUpResponses] = useState([]);

  // Active Tab: 'practice', 'saved', 'progress'
  const [activeTab, setActiveTab] = useState("practice");
  const [savedQuestions, setSavedQuestions] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [progressData, setProgressData] = useState(null);

  const token = session?.token || user?.token;

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [catRes, examRes] = await Promise.all([
        getGovCategories().catch(() => ({ categories: [] })),
        getGovExams().catch(() => ({ exams: [] }))
      ]);

      const catList = catRes?.categories || [];
      setCategories(catList);

      const examList = examRes?.exams || [];
      setAllExams(examList);

      if (examList.length > 0) {
        const firstExam = examList[0];
        setSelectedExam(firstExam);
        loadExamDetails(firstExam.id);
      }
    } catch (err) {
      console.warn("Error loading GovPrep initial data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Filter exams by category
  const filteredExams = useMemo(() => {
    if (!activeCategory || activeCategory === "All") return allExams;
    return allExams.filter((ex) => (ex.category || "").toLowerCase() === activeCategory.toLowerCase());
  }, [allExams, activeCategory]);

  async function loadExamDetails(examId) {
    if (!examId) return;
    try {
      const [yearRes, subRes] = await Promise.all([
        getGovYears(examId).catch(() => ({ years: [] })),
        getGovSubjects(examId).catch(() => ({ subjects: [] }))
      ]);

      const yrList = yearRes?.years || [];
      setYears(yrList);
      const defaultYr = yrList.length > 0 ? String(yrList[0]) : "";
      setSelectedYear(defaultYr);

      const subList = subRes?.subjects || [];
      setSubjects(subList);
      setSelectedSubject(null);
      setSelectedTopic(null);
      setTopics([]);

      updateAvailableCount(examId, defaultYr, null, null);
    } catch (e) {
      console.warn("Error loading exam details:", e);
    }
  }

  function handleCategoryChange(catName) {
    setActiveCategory(catName);
    const available = catName === "All" ? allExams : allExams.filter((ex) => (ex.category || "").toLowerCase() === catName.toLowerCase());
    if (available.length > 0) {
      setSelectedExam(available[0]);
      loadExamDetails(available[0].id);
    } else {
      setSelectedExam(null);
      setYears([]);
      setSubjects([]);
      setAvailableCount(0);
    }
  }

  function handleSelectExam(exam) {
    setSelectedExam(exam);
    loadExamDetails(exam.id);
  }

  async function handleSelectSubject(subject) {
    setSelectedSubject(subject);
    setSelectedTopic(null);
    if (subject && subject.id) {
      try {
        const topRes = await getGovTopics(subject.id).catch(() => ({ topics: [] }));
        setTopics(topRes?.topics || []);
        updateAvailableCount(selectedExam?.id, selectedYear, subject.id, null);
      } catch (e) {}
    } else {
      setTopics([]);
      updateAvailableCount(selectedExam?.id, selectedYear, null, null);
    }
  }

  async function handleSelectTopic(topic) {
    setSelectedTopic(topic);
    updateAvailableCount(selectedExam?.id, selectedYear, selectedSubject?.id, topic?.id);
  }

  async function updateAvailableCount(examId, year, subjectId, topicId) {
    try {
      const params = {};
      if (examId) params.examId = examId;
      if (year) params.year = year;
      if (subjectId) params.subjectId = subjectId;
      if (topicId) params.topicId = topicId;

      const res = await getGovQuestionCount(params).catch(() => ({ count: 0 }));
      setAvailableCount(res?.count || 0);
    } catch (e) {
      setAvailableCount(0);
    }
  }

  async function handleStartPractice() {
    if (!selectedExam) {
      Alert.alert("Select Exam", "Please select an exam to start practicing.");
      return;
    }
    setLoading(true);
    try {
      const params = {};
      if (selectedExam?.id) params.examId = selectedExam.id;
      if (selectedYear) params.year = selectedYear;
      if (selectedSubject?.id) params.subjectId = selectedSubject.id;
      if (selectedTopic?.id) params.topicId = selectedTopic.id;

      if (questionCountLimit !== "all") {
        params.limit = questionCountLimit;
      } else {
        params.limit = 100;
      }

      const res = await getGovQuestions(params).catch(() => ({ questions: [] }));
      const qList = res?.questions || [];

      if (qList.length === 0) {
        Alert.alert(
          "No Questions Available",
          `No questions available for ${selectedExam.name} (${selectedYear || "All Years"}) yet.\n\nTry selecting another year or subject.`
        );
        setInPractice(false);
      } else {
        setQuestions(qList);
        setCurrentIndex(0);
        setSelectedOption(null);
        setIsAnswerSubmitted(false);
        setAiExplanation(null);
        setFollowUpResponses([]);
        setInPractice(true);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to load practice questions.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!selectedOption || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);

    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const isCorrect = String(selectedOption).trim().toUpperCase() === String(currentQ.correctAnswer).trim().toUpperCase();

    if (token) {
      attemptGovQuestion(token, currentQ.id || currentQ._id, {
        selectedAnswer: selectedOption,
        isCorrect,
        timeTaken: 12
      }).catch(() => {});
    }
  }

  async function handleToggleSaveQuestion(q) {
    if (!token) {
      Alert.alert("Login Required", "Please log in to save questions.");
      return;
    }
    const qId = q.id || q._id;
    try {
      const res = await saveGovQuestion(token, qId);
      if (res?.saved) {
        setSavedIds((prev) => [...prev, qId]);
      } else {
        setSavedIds((prev) => prev.filter((id) => id !== qId));
      }
    } catch (e) {}
  }

  async function handleExplainWithAI(customLang = aiLanguage, followUpText = "") {
    const currentQ = questions[currentIndex];
    if (!currentQ || !token) {
      if (!token) Alert.alert("Login Required", "Please log in to use AI Explanation.");
      return;
    }

    setAiLoading(true);
    try {
      const payload = { language: customLang };
      if (followUpText) payload.followUp = followUpText;

      const res = await explainGovQuestionWithAI(token, currentQ.id || currentQ._id, payload);
      if (res && res.success) {
        if (followUpText) {
          setFollowUpResponses((prev) => [
            ...prev,
            { query: followUpText, text: res.detailedExplanation }
          ]);
          setFollowUpQuery("");
        } else {
          setAiExplanation(res);
        }
      }
    } catch (err) {
      Alert.alert("AI Explanation Error", "Could not load AI explanation. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  function handleNextQuestion() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setAiExplanation(null);
      setFollowUpResponses([]);
    }
  }

  function handlePrevQuestion() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setAiExplanation(null);
      setFollowUpResponses([]);
    }
  }

  async function loadProgressTab() {
    setActiveTab("progress");
    if (!token) return;
    try {
      const res = await getGovProgress(token).catch(() => null);
      if (res?.progress) setProgressData(res.progress);
    } catch (e) {}
  }

  async function loadSavedTab() {
    setActiveTab("saved");
    if (!token) return;
    try {
      const res = await getSavedGovQuestions(token).catch(() => ({ questions: [] }));
      if (res?.questions) setSavedQuestions(res.questions);
    } catch (e) {}
  }

  const currentQ = questions[currentIndex];
  const progressPct = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const isSavedCurrent = currentQ ? savedIds.includes(currentQ.id || currentQ._id) : false;

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* Dynamic Header */}
      <View style={[styles.headerContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity style={[styles.backIconBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]} onPress={onBack}>
            <Feather name="arrow-left" size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <View style={styles.headerBadgePill}>
              <MaterialCommunityIcons name="bank" size={12} color="#5B3CF5" />
              <Text style={styles.headerBadgePillText}>GOVERNMENT EXAM PREP</Text>
            </View>
            <Text style={[styles.headerTitleText, { color: theme.text }]}>TCM One Exam Module</Text>
          </View>
        </View>

        <View style={styles.headerRightBadge}>
          <MaterialCommunityIcons name="shield-check-outline" size={14} color="#059669" />
          <Text style={styles.headerRightBadgeText}>Official PYQs</Text>
        </View>
      </View>

      {/* Main Tab Switcher: Setup, Saved, Analytics */}
      <View style={[styles.tabBarContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "practice" && styles.tabButtonActive]}
          onPress={() => {
            setActiveTab("practice");
            setInPractice(false);
          }}
        >
          <MaterialCommunityIcons name="compass-outline" size={17} color={activeTab === "practice" ? "#5B3CF5" : theme.subtext} />
          <Text style={[styles.tabButtonText, { color: activeTab === "practice" ? "#5B3CF5" : theme.subtext }, activeTab === "practice" && styles.tabButtonTextActive]}>
            Exam Setup
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabButton, activeTab === "saved" && styles.tabButtonActive]} onPress={loadSavedTab}>
          <MaterialCommunityIcons name="bookmark-check-outline" size={17} color={activeTab === "saved" ? "#5B3CF5" : theme.subtext} />
          <Text style={[styles.tabButtonText, { color: activeTab === "saved" ? "#5B3CF5" : theme.subtext }, activeTab === "saved" && styles.tabButtonTextActive]}>
            Saved ({savedIds.length || savedQuestions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabButton, activeTab === "progress" && styles.tabButtonActive]} onPress={loadProgressTab}>
          <MaterialCommunityIcons name="chart-bar" size={17} color={activeTab === "progress" ? "#5B3CF5" : theme.subtext} />
          <Text style={[styles.tabButtonText, { color: activeTab === "progress" ? "#5B3CF5" : theme.subtext }, activeTab === "progress" && styles.tabButtonTextActive]}>
            My Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY CONTENT SCROLLVIEW */}
      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollBodyContent} showsVerticalScrollIndicator={false}>
        {/* VIEW 1: EXAM SETUP & FILTER SELECTION */}
        {activeTab === "practice" && !inPractice ? (
          <View style={styles.setupMainWrapper}>
            {/* Step 1: Exam Category Selector */}
            <View style={styles.stepSectionHeader}>
              <Text style={[styles.stepNumberBadge, { backgroundColor: "#5B3CF5" }]}>1</Text>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Select Exam Category</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScrollRow}>
              {["All", "SSC", "Railway", "Banking", "UPSC"].map((catName) => {
                const isActive = activeCategory === catName;
                return (
                  <TouchableOpacity
                    key={`cat_${catName}`}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: theme.cardBg, borderColor: theme.border },
                      isActive && styles.categoryChipActive
                    ]}
                    onPress={() => handleCategoryChange(catName)}
                  >
                    <MaterialCommunityIcons
                      name={catName === "SSC" ? "bank-outline" : catName === "Railway" ? "train" : catName === "Banking" ? "credit-card-chip-outline" : catName === "UPSC" ? "scale-balance" : "grid-large"}
                      size={15}
                      color={isActive ? "#FFFFFF" : theme.subtext}
                    />
                    <Text style={[styles.categoryChipText, { color: theme.text }, isActive && styles.categoryChipTextActive]}>
                      {catName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Step 2: Exam Grid Cards */}
            <View style={[styles.stepSectionHeader, { marginTop: 22 }]}>
              <Text style={[styles.stepNumberBadge, { backgroundColor: "#5B3CF5" }]}>2</Text>
              <Text style={[styles.stepTitle, { color: theme.text }]}>Choose Target Exam</Text>
            </View>

            {filteredExams.length > 0 ? (
              <View style={styles.examGridContainer}>
                {filteredExams.map((ex) => {
                  const isSelected = selectedExam?.id === ex.id;
                  let iconName = "shield-check";
                  if (ex.category === "SSC") iconName = "bank";
                  else if (ex.category === "Railway") iconName = "train";
                  else if (ex.category === "Banking") iconName = "credit-card-outline";
                  else if (ex.category === "UPSC") iconName = "book-education-outline";

                  return (
                    <TouchableOpacity
                      key={ex.id || ex._id}
                      style={[
                        styles.examCardBox,
                        { backgroundColor: theme.cardBg, borderColor: theme.border },
                        isSelected && [styles.examCardBoxSelected, { backgroundColor: theme.isDark ? "#1E1B4B" : "#F0EDFF" }]
                      ]}
                      onPress={() => handleSelectExam(ex)}
                    >
                      <View style={styles.examCardTopRow}>
                        <View style={[styles.examIconCircle, { backgroundColor: isSelected ? "#5B3CF5" : theme.isDark ? "#1E293B" : "#F1F5F9" }]}>
                          <MaterialCommunityIcons name={iconName} size={20} color={isSelected ? "#FFFFFF" : "#5B3CF5"} />
                        </View>
                        {isSelected ? (
                          <MaterialCommunityIcons name="check-circle" size={20} color="#5B3CF5" />
                        ) : (
                          <View style={[styles.examCategoryTag, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}>
                            <Text style={[styles.examCategoryTagText, { color: theme.subtext }]}>{ex.category}</Text>
                          </View>
                        )}
                      </View>

                      <Text style={[styles.examCardName, { color: theme.text }, isSelected && styles.examCardNameSelected]}>
                        {ex.name}
                      </Text>
                      <Text style={[styles.examCardDesc, { color: theme.subtext }]} numberOfLines={2}>
                        {ex.description || "Official PYQ question bank & mock practice"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.emptyNoticeBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={24} color={theme.subtext} />
                <Text style={[styles.emptyNoticeText, { color: theme.subtext }]}>No exams found in {activeCategory} category.</Text>
              </View>
            )}

            {/* Step 3: Real Year Selection */}
            {selectedExam ? (
              <>
                <View style={[styles.stepSectionHeader, { marginTop: 22 }]}>
                  <Text style={[styles.stepNumberBadge, { backgroundColor: "#5B3CF5" }]}>3</Text>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>Select Exam Year (Official Papers)</Text>
                </View>

                {years.length > 0 ? (
                  <View style={styles.pillsWrapRow}>
                    <TouchableOpacity
                      style={[
                        styles.yearPill,
                        { backgroundColor: theme.cardBg, borderColor: theme.border },
                        selectedYear === "" && styles.yearPillActive
                      ]}
                      onPress={() => {
                        setSelectedYear("");
                        updateAvailableCount(selectedExam?.id, "", selectedSubject?.id, selectedTopic?.id);
                      }}
                    >
                      <Text style={[styles.yearPillText, { color: theme.text }, selectedYear === "" && styles.yearPillTextActive]}>
                        All Available Years
                      </Text>
                    </TouchableOpacity>

                    {years.map((yr) => {
                      const isYrSelected = selectedYear === String(yr);
                      return (
                        <TouchableOpacity
                          key={`yr_${yr}`}
                          style={[
                            styles.yearPill,
                            { backgroundColor: theme.cardBg, borderColor: theme.border },
                            isYrSelected && styles.yearPillActive
                          ]}
                          onPress={() => {
                            setSelectedYear(String(yr));
                            updateAvailableCount(selectedExam?.id, String(yr), selectedSubject?.id, selectedTopic?.id);
                          }}
                        >
                          <MaterialCommunityIcons name="calendar-check" size={14} color={isYrSelected ? "#FFFFFF" : "#5B3CF5"} />
                          <Text style={[styles.yearPillText, { color: theme.text }, isYrSelected && styles.yearPillTextActive]}>
                            {yr} PYQ Paper
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={[styles.emptyNoticeNote, { color: theme.subtext }]}>
                    All questions for {selectedExam.name} will be included in the test set.
                  </Text>
                )}

                {/* Step 4: Subject Selection (Optional) */}
                {subjects.length > 0 ? (
                  <>
                    <View style={[styles.stepSectionHeader, { marginTop: 22 }]}>
                      <Text style={[styles.stepNumberBadge, { backgroundColor: "#5B3CF5" }]}>4</Text>
                      <Text style={[styles.stepTitle, { color: theme.text }]}>Choose Subject (Optional)</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScrollRow}>
                      <TouchableOpacity
                        style={[
                          styles.subjectChip,
                          { backgroundColor: theme.cardBg, borderColor: theme.border },
                          !selectedSubject && styles.subjectChipActive
                        ]}
                        onPress={() => handleSelectSubject(null)}
                      >
                        <Text style={[styles.subjectChipText, { color: theme.text }, !selectedSubject && styles.subjectChipTextActive]}>
                          All Subjects
                        </Text>
                      </TouchableOpacity>

                      {subjects.map((sub) => {
                        const isSubSelected = selectedSubject?.id === sub.id;
                        return (
                          <TouchableOpacity
                            key={sub.id || sub._id}
                            style={[
                              styles.subjectChip,
                              { backgroundColor: theme.cardBg, borderColor: theme.border },
                              isSubSelected && styles.subjectChipActive
                            ]}
                            onPress={() => handleSelectSubject(sub)}
                          >
                            <MaterialCommunityIcons name="book-open-variant" size={14} color={isSubSelected ? "#FFFFFF" : "#5B3CF5"} />
                            <Text style={[styles.subjectChipText, { color: theme.text }, isSubSelected && styles.subjectChipTextActive]}>
                              {sub.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </>
                ) : null}

                {/* Step 5: Question Count & Live Setup Summary Card */}
                <View style={[styles.stepSectionHeader, { marginTop: 22 }]}>
                  <Text style={[styles.stepNumberBadge, { backgroundColor: "#5B3CF5" }]}>5</Text>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>Questions Per Session</Text>
                </View>

                <View style={styles.pillsWrapRow}>
                  {["10", "20", "50", "100", "all"].map((limit) => {
                    const isLimitActive = questionCountLimit === limit;
                    return (
                      <TouchableOpacity
                        key={`limit_${limit}`}
                        style={[
                          styles.limitPill,
                          { backgroundColor: theme.cardBg, borderColor: theme.border },
                          isLimitActive && styles.limitPillActive
                        ]}
                        onPress={() => setQuestionCountLimit(limit)}
                      >
                        <Text style={[styles.limitPillText, { color: theme.text }, isLimitActive && styles.limitPillTextActive]}>
                          {limit === "all" ? "All Questions" : `${limit} MCQs`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Live Setup Summary Banner */}
                <View style={[styles.summaryBannerCard, { backgroundColor: theme.isDark ? "#1E1B4B" : "#F0EDFF", borderColor: "#C4B5FD" }]}>
                  <View style={styles.summaryTopRow}>
                    <MaterialCommunityIcons name="target" size={20} color="#5B3CF5" />
                    <Text style={styles.summaryTargetHeading}>SESSION CONFIGURATION</Text>
                  </View>

                  <Text style={[styles.summaryTitle, { color: theme.isDark ? "#FFFFFF" : "#0F172A" }]}>
                    {selectedExam.name} • {selectedYear ? `${selectedYear} PYQ` : "All Years"}
                  </Text>
                  <Text style={[styles.summarySubText, { color: theme.isDark ? "#CBD5E1" : "#475569" }]}>
                    Subject: {selectedSubject ? selectedSubject.name : "All Subjects"} • Limit: {questionCountLimit === "all" ? "All Available" : `${questionCountLimit} Questions`}
                  </Text>

                  <View style={styles.availableCounterBadge}>
                    <MaterialCommunityIcons name="check-decagram" size={16} color="#059669" />
                    <Text style={styles.availableCounterBadgeText}>
                      <Text style={{ fontWeight: "700" }}>{availableCount.toLocaleString()}</Text> Questions Active in Database
                    </Text>
                  </View>

                  {/* Start Practice CTA */}
                  <TouchableOpacity style={styles.startPracticeBtnCTA} onPress={handleStartPractice} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.startPracticeBtnCTAText}>Start Practice Session →</Text>
                        <MaterialCommunityIcons name="rocket-launch" size={18} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        ) : null}

        {/* VIEW 2: ACTIVE QUESTION PRACTICE SESSION */}
        {inPractice && currentQ ? (
          <View style={styles.practiceSessionContainer}>
            {/* Header Progress & Exit */}
            <View style={[styles.practiceTopNav, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <TouchableOpacity style={styles.exitSessionBtn} onPress={() => setInPractice(false)}>
                <Feather name="x" size={18} color={theme.text} />
                <Text style={[styles.exitSessionText, { color: theme.text }]}>Exit</Text>
              </TouchableOpacity>

              <View style={styles.progressCounterBox}>
                <Text style={[styles.progressCounterText, { color: theme.text }]}>
                  Question <Text style={{ color: "#5B3CF5", fontWeight: "700" }}>{currentIndex + 1}</Text> / {questions.length}
                </Text>
              </View>

              <TouchableOpacity style={styles.bookmarkHeaderBtn} onPress={() => handleToggleSaveQuestion(currentQ)}>
                <MaterialCommunityIcons
                  name={isSavedCurrent ? "bookmark" : "bookmark-outline"}
                  size={22}
                  color={isSavedCurrent ? "#5B3CF5" : theme.subtext}
                />
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            </View>

            {/* Meta Tags Row */}
            <View style={styles.questionMetaRow}>
              <View style={[styles.metaBadge, { backgroundColor: "#F0EDFF" }]}>
                <Text style={[styles.metaBadgeText, { color: "#5B3CF5" }]}>{currentQ.examName || selectedExam?.name}</Text>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: "#ECFDF5" }]}>
                <Text style={[styles.metaBadgeText, { color: "#059669" }]}>{currentQ.subjectName || "General Paper"}</Text>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: "#FEF3C7" }]}>
                <Text style={[styles.metaBadgeText, { color: "#D97706" }]}>
                  {currentQ.type === "pyq" ? `Official ${currentQ.year || "PYQ"}` : "Practice MCQ"}
                </Text>
              </View>
            </View>

            {/* Question Text Box */}
            <View style={[styles.questionCardBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Text style={[styles.questionTextTitle, { color: theme.text }]}>
                Q{currentIndex + 1}. {currentQ.questionText}
              </Text>

              {/* Options List */}
              <View style={styles.optionsListContainer}>
                {currentQ.options?.map((opt) => {
                  const isSelected = selectedOption === opt.label;
                  const isCorrectOpt = String(opt.label).toUpperCase() === String(currentQ.correctAnswer).toUpperCase();

                  let borderStyle = theme.border;
                  let bgStyle = theme.cardBg;
                  let circleBg = theme.isDark ? "#1E293B" : "#F1F5F9";
                  let circleTextColor = theme.text;

                  if (isAnswerSubmitted) {
                    if (isCorrectOpt) {
                      borderStyle = "#10B981";
                      bgStyle = theme.isDark ? "#064E3B" : "#ECFDF5";
                      circleBg = "#10B981";
                      circleTextColor = "#FFFFFF";
                    } else if (isSelected && !isCorrectOpt) {
                      borderStyle = "#EF4444";
                      bgStyle = theme.isDark ? "#7F1D1D" : "#FEF2F2";
                      circleBg = "#EF4444";
                      circleTextColor = "#FFFFFF";
                    }
                  } else if (isSelected) {
                    borderStyle = "#5B3CF5";
                    bgStyle = theme.isDark ? "#1E1B4B" : "#F0EDFF";
                    circleBg = "#5B3CF5";
                    circleTextColor = "#FFFFFF";
                  }

                  return (
                    <TouchableOpacity
                      key={`opt_${opt.label}`}
                      style={[styles.optionRowBtn, { backgroundColor: bgStyle, borderColor: borderStyle }]}
                      onPress={() => !isAnswerSubmitted && setSelectedOption(opt.label)}
                      disabled={isAnswerSubmitted}
                    >
                      <View style={[styles.optionCircle, { backgroundColor: circleBg }]}>
                        <Text style={[styles.optionCircleText, { color: circleTextColor }]}>{opt.label}</Text>
                      </View>

                      <Text style={[styles.optionTextContent, { color: theme.text }]}>{opt.text}</Text>

                      {isAnswerSubmitted && isCorrectOpt ? (
                        <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" style={{ marginLeft: "auto" }} />
                      ) : isAnswerSubmitted && isSelected && !isCorrectOpt ? (
                        <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" style={{ marginLeft: "auto" }} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Buttons: Submit / Result */}
              {!isAnswerSubmitted ? (
                <TouchableOpacity
                  style={[styles.submitAnswerBtn, !selectedOption && styles.submitAnswerBtnDisabled]}
                  onPress={handleSubmitAnswer}
                  disabled={!selectedOption}
                >
                  <Text style={styles.submitAnswerBtnText}>Submit Answer</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.resultContainer}>
                  {selectedOption === currentQ.correctAnswer ? (
                    <View style={styles.resultBannerCorrect}>
                      <MaterialCommunityIcons name="check-decagram" size={22} color="#10B981" />
                      <Text style={styles.resultTextCorrect}>✓ Correct Answer! Well done.</Text>
                    </View>
                  ) : (
                    <View style={styles.resultBannerIncorrect}>
                      <MaterialCommunityIcons name="alert-circle" size={22} color="#EF4444" />
                      <Text style={styles.resultTextIncorrect}>
                        ✗ Incorrect. The correct answer is Option {currentQ.correctAnswer}.
                      </Text>
                    </View>
                  )}

                  {/* Groq AI Explanation Button */}
                  <TouchableOpacity style={styles.aiExplainTriggerBtn} onPress={() => handleExplainWithAI(aiLanguage)}>
                    {aiLoading ? (
                      <ActivityIndicator color="#5B3CF5" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="sparkles" size={18} color="#5B3CF5" />
                        <Text style={styles.aiExplainTriggerBtnText}>Explain with Groq AI ✨</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* GROQ AI EXPLANATION SECTION */}
              {aiExplanation ? (
                <View style={[styles.aiExplanationWrapper, { backgroundColor: theme.isDark ? "#1E1B4B" : "#F8F5FF", borderColor: "#DDD6FE" }]}>
                  <View style={styles.aiCardHeaderRow}>
                    <View style={styles.aiRobotBadge}>
                      <MaterialCommunityIcons name="robot" size={18} color="#5B3CF5" />
                      <Text style={styles.aiRobotBadgeText}>GROQ AI TUTOR</Text>
                    </View>

                    {/* Language Pills */}
                    <View style={styles.langPillsRow}>
                      {["en", "hi", "hinglish"].map((lang) => {
                        const isLangActive = aiLanguage === lang;
                        return (
                          <TouchableOpacity
                            key={`lang_${lang}`}
                            style={[styles.langPillItem, isLangActive && styles.langPillItemActive]}
                            onPress={() => {
                              setAiLanguage(lang);
                              handleExplainWithAI(lang);
                            }}
                          >
                            <Text style={[styles.langPillItemText, isLangActive && styles.langPillItemTextActive]}>
                              {lang === "en" ? "English" : lang === "hi" ? "हिंदी" : "Hinglish"}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <ScrollView style={styles.aiContentScroll} nestedScrollEnabled={true}>
                    <Text style={[styles.aiExplanationText, { color: theme.isDark ? "#F8FAFC" : "#0F172A" }]}>
                      {aiExplanation.detailedExplanation}
                    </Text>

                    {/* Follow-up Question Answers */}
                    {followUpResponses.map((item, fIdx) => (
                      <View key={`fup_${fIdx}`} style={styles.followUpCardItem}>
                        <Text style={styles.followUpCardQuery}>Q: {item.query}</Text>
                        <Text style={[styles.followUpCardAnswer, { color: theme.isDark ? "#CBD5E1" : "#334155" }]}>{item.text}</Text>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Interactive Follow-up Input */}
                  <View style={styles.followUpInputBox}>
                    <TextInput
                      style={[styles.followUpTextInput, { color: theme.text }]}
                      placeholder="Ask follow-up (e.g., Explain shortcut trick)..."
                      placeholderTextColor={theme.subtext}
                      value={followUpQuery}
                      onChangeText={setFollowUpQuery}
                    />
                    <TouchableOpacity
                      style={styles.sendFollowUpActionBtn}
                      onPress={() => followUpQuery.trim() && handleExplainWithAI(aiLanguage, followUpQuery.trim())}
                    >
                      <MaterialCommunityIcons name="send" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Bottom Question Navigation Controls */}
            <View style={styles.bottomNavControlsRow}>
              <TouchableOpacity
                style={[
                  styles.navChevronBtn,
                  { backgroundColor: theme.cardBg, borderColor: theme.border },
                  currentIndex === 0 && styles.navChevronBtnDisabled
                ]}
                onPress={handlePrevQuestion}
                disabled={currentIndex === 0}
              >
                <MaterialCommunityIcons name="chevron-left" size={20} color={theme.text} />
                <Text style={[styles.navChevronBtnText, { color: theme.text }]}>Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.navChevronBtn,
                  styles.navChevronBtnPrimary,
                  currentIndex === questions.length - 1 && styles.navChevronBtnDisabled
                ]}
                onPress={handleNextQuestion}
                disabled={currentIndex === questions.length - 1}
              >
                <Text style={styles.navChevronBtnPrimaryText}>Next Question</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* VIEW 3: SAVED QUESTIONS TAB */}
        {activeTab === "saved" ? (
          <View style={styles.tabSectionWrapper}>
            <Text style={[styles.tabSectionHeading, { color: theme.text }]}>
              Saved Questions ({savedQuestions.length})
            </Text>

            {savedQuestions.length === 0 ? (
              <View style={[styles.emptyStateCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="bookmark-outline" size={48} color={theme.subtext} />
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No saved questions yet</Text>
                <Text style={[styles.emptyStateSub, { color: theme.subtext }]}>
                  Bookmark questions during your practice session to review them anytime here.
                </Text>
              </View>
            ) : (
              savedQuestions.map((q, idx) => (
                <View key={`sq_${idx}`} style={[styles.savedItemCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                  <View style={styles.savedCardHeader}>
                    <Text style={styles.savedCardExamTag}>{q.examName} ({q.year || "PYQ"}) • {q.subjectName}</Text>
                    <TouchableOpacity onPress={() => handleToggleSaveQuestion(q)}>
                      <MaterialCommunityIcons name="bookmark-remove" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.savedCardQuestionText, { color: theme.text }]}>{q.questionText}</Text>
                  <View style={styles.savedCardAnsBox}>
                    <Text style={styles.savedCardAnsText}>✓ Correct Answer: Option {q.correctAnswer}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {/* VIEW 4: MY PERFORMANCE & ANALYTICS TAB */}
        {activeTab === "progress" ? (
          <View style={styles.tabSectionWrapper}>
            <Text style={[styles.tabSectionHeading, { color: theme.text }]}>Practice Analytics & Accuracy</Text>

            <View style={styles.statsQuadGrid}>
              <View style={[styles.statQuadCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.statQuadValue, { color: theme.text }]}>{progressData?.totalAttempted || 0}</Text>
                <Text style={[styles.statQuadLabel, { color: theme.subtext }]}>Total Attempted</Text>
              </View>
              <View style={[styles.statQuadCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.statQuadValue, { color: "#10B981" }]}>{progressData?.correctCount || 0}</Text>
                <Text style={[styles.statQuadLabel, { color: theme.subtext }]}>Correct Answers</Text>
              </View>
              <View style={[styles.statQuadCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.statQuadValue, { color: "#EF4444" }]}>{progressData?.incorrectCount || 0}</Text>
                <Text style={[styles.statQuadLabel, { color: theme.subtext }]}>Incorrect</Text>
              </View>
              <View style={[styles.statQuadCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.statQuadValue, { color: "#5B3CF5" }]}>{progressData?.accuracy || 0}%</Text>
                <Text style={[styles.statQuadLabel, { color: theme.subtext }]}>Accuracy Rate</Text>
              </View>
            </View>

            {/* Subject Breakdown */}
            {progressData?.subjectBreakdown?.length ? (
              <View style={[styles.subjectBreakdownWrapper, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <Text style={[styles.subjectBreakdownHeading, { color: theme.text }]}>Subject-Wise Accuracy</Text>
                {progressData.subjectBreakdown.map((s, sIdx) => (
                  <View key={`sb_${sIdx}`} style={styles.subjectBreakdownRow}>
                    <Text style={[styles.subjectBreakdownName, { color: theme.text }]}>{s.subject}</Text>
                    <View style={styles.subjectBarBgTrack}>
                      <View style={[styles.subjectBarFillTrack, { width: `${s.accuracy}%` }]} />
                    </View>
                    <Text style={styles.subjectBreakdownPct}>{s.accuracy}%</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  headerLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  backIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitleBox: {},
  headerBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2
  },
  headerBadgePillText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: "#5B3CF5",
    letterSpacing: 0.5
  },
  headerTitleText: {
    fontSize: 15,
    fontFamily: fonts.bold
  },
  headerRightBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0"
  },
  headerRightBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#059669"
  },

  // Main Tab Switcher
  tabBarContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10
  },
  tabButtonActive: {
    backgroundColor: "#F0EDFF"
  },
  tabButtonText: {
    fontSize: 12,
    fontFamily: fonts.medium
  },
  tabButtonTextActive: {
    fontFamily: fonts.bold
  },

  scrollBody: {
    flex: 1
  },
  scrollBodyContent: {
    padding: 16,
    paddingBottom: 60
  },

  // Setup Step Elements
  setupMainWrapper: {},
  stepSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: fonts.bold,
    textAlign: "center",
    lineHeight: 22
  },
  stepTitle: {
    fontSize: 15,
    fontFamily: fonts.bold
  },

  horizontalScrollRow: {
    flexDirection: "row"
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8
  },
  categoryChipActive: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: fonts.medium
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },

  // Exam Grid
  examGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  examCardBox: {
    width: (width - 44) / 2,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "space-between"
  },
  examCardBoxSelected: {
    borderColor: "#5B3CF5",
    borderWidth: 2
  },
  examCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  examIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  examCategoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  examCategoryTagText: {
    fontSize: 10,
    fontFamily: fonts.medium
  },
  examCardName: {
    fontSize: 14,
    fontFamily: fonts.bold,
    marginBottom: 4
  },
  examCardNameSelected: {
    color: "#5B3CF5"
  },
  examCardDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    lineHeight: 15
  },

  emptyNoticeBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center"
  },
  emptyNoticeText: {
    fontSize: 13,
    fontFamily: fonts.medium
  },
  emptyNoticeNote: {
    fontSize: 12,
    fontFamily: fonts.regular,
    fontStyle: "italic"
  },

  // Pills Row
  pillsWrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  yearPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1
  },
  yearPillActive: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  yearPillText: {
    fontSize: 12,
    fontFamily: fonts.medium
  },
  yearPillTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },

  subjectChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8
  },
  subjectChipActive: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  subjectChipText: {
    fontSize: 12,
    fontFamily: fonts.medium
  },
  subjectChipTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },

  limitPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1
  },
  limitPillActive: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  limitPillText: {
    fontSize: 12,
    fontFamily: fonts.medium
  },
  limitPillTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },

  // Summary Banner
  summaryBannerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 24,
    ...shadow.soft
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6
  },
  summaryTargetHeading: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: "#5B3CF5",
    letterSpacing: 0.5
  },
  summaryTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    marginBottom: 4
  },
  summarySubText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginBottom: 12
  },
  availableCounterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 14
  },
  availableCounterBadgeText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: "#059669"
  },
  startPracticeBtnCTA: {
    backgroundColor: "#5B3CF5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12
  },
  startPracticeBtnCTAText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 14
  },

  // Practice Session Styles
  practiceSessionContainer: {},
  practiceTopNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10
  },
  exitSessionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  exitSessionText: {
    fontSize: 13,
    fontFamily: fonts.medium
  },
  progressCounterBox: {},
  progressCounterText: {
    fontSize: 13,
    fontFamily: fonts.medium
  },
  bookmarkHeaderBtn: {
    padding: 4
  },

  progressBarTrack: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 14
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#5B3CF5"
  },

  questionMetaRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  metaBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold
  },

  questionCardBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16
  },
  questionTextTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    lineHeight: 22,
    marginBottom: 16
  },

  optionsListContainer: {
    gap: 10,
    marginBottom: 16
  },
  optionRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5
  },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  optionCircleText: {
    fontSize: 12,
    fontFamily: fonts.bold
  },
  optionTextContent: {
    fontSize: 13,
    fontFamily: fonts.medium,
    flex: 1
  },

  submitAnswerBtn: {
    backgroundColor: "#5B3CF5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  submitAnswerBtnDisabled: {
    opacity: 0.5
  },
  submitAnswerBtnText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 14
  },

  resultContainer: {
    gap: 12
  },
  resultBannerCorrect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    padding: 12,
    borderRadius: 10
  },
  resultTextCorrect: {
    color: "#059669",
    fontFamily: fonts.bold,
    fontSize: 13
  },
  resultBannerIncorrect: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 10
  },
  resultTextIncorrect: {
    color: "#EF4444",
    fontFamily: fonts.bold,
    fontSize: 13
  },

  aiExplainTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F0EDFF",
    borderWidth: 1,
    borderColor: "#C4B5FD",
    paddingVertical: 10,
    borderRadius: 10
  },
  aiExplainTriggerBtnText: {
    color: "#5B3CF5",
    fontFamily: fonts.bold,
    fontSize: 13
  },

  // AI Explanation Wrapper
  aiExplanationWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 16
  },
  aiCardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12
  },
  aiRobotBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  aiRobotBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },
  langPillsRow: {
    flexDirection: "row",
    gap: 4
  },
  langPillItem: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#E2E8F0"
  },
  langPillItemActive: {
    backgroundColor: "#5B3CF5"
  },
  langPillItemText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: "#475569"
  },
  langPillItemTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.bold
  },

  aiContentScroll: {
    maxHeight: 180,
    marginBottom: 10
  },
  aiExplanationText: {
    fontSize: 12.5,
    fontFamily: fonts.regular,
    lineHeight: 18
  },

  followUpCardItem: {
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 8,
    marginTop: 8
  },
  followUpCardQuery: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },
  followUpCardAnswer: {
    fontSize: 11.5,
    fontFamily: fonts.regular,
    marginTop: 2
  },

  followUpInputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  followUpTextInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: fonts.regular
  },
  sendFollowUpActionBtn: {
    backgroundColor: "#5B3CF5",
    padding: 8,
    borderRadius: 8
  },

  bottomNavControlsRow: {
    flexDirection: "row",
    gap: 12
  },
  navChevronBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1
  },
  navChevronBtnDisabled: {
    opacity: 0.4
  },
  navChevronBtnText: {
    fontSize: 13,
    fontFamily: fonts.medium
  },
  navChevronBtnPrimary: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  navChevronBtnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: fonts.bold
  },

  // Saved & Progress Tabs
  tabSectionWrapper: {},
  tabSectionHeading: {
    fontSize: 16,
    fontFamily: fonts.bold,
    marginBottom: 14
  },

  emptyStateCard: {
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center"
  },
  emptyStateTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    marginTop: 10,
    marginBottom: 4
  },
  emptyStateSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    textAlign: "center"
  },

  savedItemCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10
  },
  savedCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6
  },
  savedCardExamTag: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },
  savedCardQuestionText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    marginBottom: 8
  },
  savedCardAnsBox: {
    backgroundColor: "#ECFDF5",
    padding: 8,
    borderRadius: 8
  },
  savedCardAnsText: {
    fontSize: 11.5,
    fontFamily: fonts.bold,
    color: "#059669"
  },

  statsQuadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16
  },
  statQuadCard: {
    width: (width - 42) / 2,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center"
  },
  statQuadValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
    marginBottom: 2
  },
  statQuadLabel: {
    fontSize: 11,
    fontFamily: fonts.medium
  },

  subjectBreakdownWrapper: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1
  },
  subjectBreakdownHeading: {
    fontSize: 14,
    fontFamily: fonts.bold,
    marginBottom: 12
  },
  subjectBreakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10
  },
  subjectBreakdownName: {
    width: 100,
    fontSize: 12,
    fontFamily: fonts.medium
  },
  subjectBarBgTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden"
  },
  subjectBarFillTrack: {
    height: "100%",
    backgroundColor: "#5B3CF5"
  },
  subjectBreakdownPct: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#5B3CF5",
    width: 36,
    textAlign: "right"
  }
});
