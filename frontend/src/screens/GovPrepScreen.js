import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
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

export default function GovPrepScreen({ session, user, onBack }) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");

  const [exams, setExams] = useState([]);
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

  // User Selection for Current Question
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  // AI Explanation State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLanguage, setAiLanguage] = useState("en");
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [followUpResponses, setFollowUpResponses] = useState([]);

  // Saved & Progress
  const [activeTab, setActiveTab] = useState("practice"); // 'practice', 'saved', 'progress'
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
      const catRes = await getGovCategories().catch(() => ({ categories: [] }));
      const catList = catRes?.categories || [];
      setCategories(catList);

      const examRes = await getGovExams().catch(() => ({ exams: [] }));
      const examList = examRes?.exams || [];
      setExams(examList);

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

  async function loadExamDetails(examId) {
    if (!examId) return;
    try {
      const [yearRes, subRes] = await Promise.all([
        getGovYears(examId).catch(() => ({ years: [] })),
        getGovSubjects(examId).catch(() => ({ subjects: [] }))
      ]);

      const yrList = yearRes?.years || [];
      setYears(yrList);
      setSelectedYear(yrList.length > 0 ? String(yrList[0]) : "");

      const subList = subRes?.subjects || [];
      setSubjects(subList);
      setSelectedSubject(null);
      setSelectedTopic(null);
      setTopics([]);

      updateAvailableCount(examId, yrList[0] || "", null, null);
    } catch (e) {
      console.warn("Error loading exam details:", e);
    }
  }

  async function handleSelectExam(exam) {
    setSelectedExam(exam);
    loadExamDetails(exam.id);
  }

  async function handleSelectSubject(subject) {
    setSelectedSubject(subject);
    setSelectedTopic(null);
    if (subject && subject.id) {
      try {
        const topRes = await getGovTopics(subject.id).catch(() => ({ topics: [] }));
        const topList = topRes?.topics || [];
        setTopics(topList);
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
        params.limit = 200;
      }

      const res = await getGovQuestions(params).catch(() => ({ questions: [] }));
      const qList = res?.questions || [];

      if (qList.length === 0) {
        Alert.alert("No Questions Available", "No questions available for this exam and year yet.\n\nTry selecting another year or exam.");
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
        timeTaken: 10
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
      Alert.alert("AI Explanation Error", "Could not load AI explanation.");
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Top Bar Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.titleBox}>
          <View style={styles.headerBadge}>
            <MaterialCommunityIcons name="bank-outline" size={14} color="#5B3CF5" />
            <Text style={styles.headerBadgeText}>GOVERNMENT EXAMS</Text>
          </View>
          <Text style={styles.mainTitle}>Prepare Smarter. Crack Your Exam.</Text>
          <Text style={styles.subTitle}>
            Practice real exam questions, explore previous-year papers, and learn with AI-powered explanations.
          </Text>
        </View>
      </View>

      {/* Mode Tabs: Practice, Saved, Progress */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "practice" && styles.tabItemActive]}
          onPress={() => {
            setActiveTab("practice");
            setInPractice(false);
          }}
        >
          <MaterialCommunityIcons name="book-open-outline" size={18} color={activeTab === "practice" ? "#5B3CF5" : "#64748B"} />
          <Text style={[styles.tabLabel, activeTab === "practice" && styles.tabLabelActive]}>Exam Setup</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === "saved" && styles.tabItemActive]} onPress={loadSavedTab}>
          <MaterialCommunityIcons name="bookmark-outline" size={18} color={activeTab === "saved" ? "#5B3CF5" : "#64748B"} />
          <Text style={[styles.tabLabel, activeTab === "saved" && styles.tabLabelActive]}>Saved Questions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabItem, activeTab === "progress" && styles.tabItemActive]} onPress={loadProgressTab}>
          <MaterialCommunityIcons name="chart-line" size={18} color={activeTab === "progress" ? "#5B3CF5" : "#64748B"} />
          <Text style={[styles.tabLabel, activeTab === "progress" && styles.tabLabelActive]}>My Progress</Text>
        </TouchableOpacity>
      </View>

      {/* VIEW 1: PRACTICE / EXAM SELECTION SETUP */}
      {activeTab === "practice" && !inPractice ? (
        <View style={styles.setupCard}>
          {/* Dynamic Exam Categories Chips */}
          <Text style={styles.sectionHeading}>1. Exam Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
            <TouchableOpacity
              style={[styles.catChip, activeCategory === "All" && styles.catChipActive]}
              onPress={() => {
                setActiveCategory("All");
                getGovExams().then((r) => setExams(r?.exams || []));
              }}
            >
              <Text style={[styles.catChipText, activeCategory === "All" && styles.catChipTextActive]}>All Exams</Text>
            </TouchableOpacity>
            {categories.map((cat, idx) => (
              <TouchableOpacity
                key={`cat_${idx}`}
                style={[styles.catChip, activeCategory === cat.name && styles.catChipActive]}
                onPress={() => {
                  setActiveCategory(cat.name);
                  getGovExams(cat.name).then((r) => setExams(r?.exams || []));
                }}
              >
                <Text style={[styles.catChipText, activeCategory === cat.name && styles.catChipTextActive]}>
                  {cat.name} ({cat.examCount || 0})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Exam Selector Grid */}
          <Text style={[styles.sectionHeading, { marginTop: 16 }]}>2. Select Exam</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.examScroll}>
            {exams.map((ex) => (
              <TouchableOpacity
                key={ex.id || ex._id}
                style={[styles.examCard, selectedExam?.id === ex.id && styles.examCardSelected]}
                onPress={() => handleSelectExam(ex)}
              >
                <MaterialCommunityIcons
                  name="shield-check"
                  size={24}
                  color={selectedExam?.id === ex.id ? "#5B3CF5" : "#64748B"}
                />
                <Text style={[styles.examCardTitle, selectedExam?.id === ex.id && styles.examCardTitleSelected]}>
                  {ex.name}
                </Text>
                <Text style={styles.examCardSub}>{ex.category || "Govt"}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Year Selection (Only Available Years Show) */}
          <Text style={[styles.sectionHeading, { marginTop: 16 }]}>3. Select Year</Text>
          {years.length > 0 ? (
            <View style={styles.chipGrid}>
              {years.map((yr) => (
                <TouchableOpacity
                  key={`yr_${yr}`}
                  style={[styles.yearChip, selectedYear === String(yr) && styles.yearChipSelected]}
                  onPress={() => {
                    setSelectedYear(String(yr));
                    updateAvailableCount(selectedExam?.id, String(yr), selectedSubject?.id, selectedTopic?.id);
                  }}
                >
                  <Text style={[styles.yearText, selectedYear === String(yr) && styles.yearTextSelected]}>{yr}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyTextNote}>No specific year filter needed (All available questions will be loaded).</Text>
          )}

          {/* Subject Filter (Optional) */}
          {subjects.length > 0 ? (
            <>
              <Text style={[styles.sectionHeading, { marginTop: 16 }]}>4. Select Subject (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.filterChip, !selectedSubject && styles.filterChipActive]}
                  onPress={() => handleSelectSubject(null)}
                >
                  <Text style={[styles.filterChipText, !selectedSubject && styles.filterChipTextActive]}>All Subjects</Text>
                </TouchableOpacity>
                {subjects.map((sub) => (
                  <TouchableOpacity
                    key={sub.id || sub._id}
                    style={[styles.filterChip, selectedSubject?.id === sub.id && styles.filterChipActive]}
                    onPress={() => handleSelectSubject(sub)}
                  >
                    <Text style={[styles.filterChipText, selectedSubject?.id === sub.id && styles.filterChipTextActive]}>
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : null}

          {/* Question Limit Selection */}
          <Text style={[styles.sectionHeading, { marginTop: 16 }]}>5. Practice Limit</Text>
          <View style={styles.chipGrid}>
            {["10", "20", "50", "100", "all"].map((limit) => (
              <TouchableOpacity
                key={`limit_${limit}`}
                style={[styles.limitChip, questionCountLimit === limit && styles.limitChipSelected]}
                onPress={() => setQuestionCountLimit(limit)}
              >
                <Text style={[styles.limitText, questionCountLimit === limit && styles.limitTextSelected]}>
                  {limit === "all" ? "All Questions" : `${limit} Questions`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Available Question Counter Badge */}
          <View style={styles.availableCounterBox}>
            <MaterialCommunityIcons name="counter" size={20} color="#2E7D32" />
            <Text style={styles.availableCounterText}>
              Available Questions in DB: <Text style={{ fontWeight: "700" }}>{availableCount.toLocaleString()}</Text>
            </Text>
          </View>

          {/* Start Practice Action Button */}
          <TouchableOpacity style={styles.startBtn} onPress={handleStartPractice} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.startBtnText}>Start Practice Session →</Text>
                <MaterialCommunityIcons name="rocket-launch-outline" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {/* VIEW 2: ACTIVE QUESTION PRACTICE SESSION */}
      {inPractice && currentQ ? (
        <View style={styles.practiceContainer}>
          {/* Header Progress & Counter */}
          <View style={styles.practiceHeader}>
            <View>
              <Text style={styles.practiceExamBadge}>
                {currentQ.examName} • {currentQ.year}
              </Text>
              <Text style={styles.practiceSubjectBadge}>{currentQ.subjectName}</Text>
            </View>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                {currentIndex + 1} / {questions.length}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>

          {/* Question Type Badge */}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.typeBadge,
                currentQ.type === "pyq" ? styles.typePyq : currentQ.type === "mock" ? styles.typeMock : styles.typePractice
              ]}
            >
              <Text style={styles.typeBadgeText}>
                {currentQ.type === "pyq" ? "Official PYQ" : currentQ.type === "mock" ? "Mock Test" : "Practice Question"}
              </Text>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={() => handleToggleSaveQuestion(currentQ)}>
              <MaterialCommunityIcons
                name={isSavedCurrent ? "bookmark" : "bookmark-outline"}
                size={22}
                color={isSavedCurrent ? "#5B3CF5" : "#64748B"}
              />
              <Text style={[styles.saveBtnText, isSavedCurrent && { color: "#5B3CF5", fontWeight: "700" }]}>
                {isSavedCurrent ? "Saved" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Question Card */}
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>
              Q{currentIndex + 1}. {currentQ.questionText}
            </Text>

            {/* Options List */}
            <View style={styles.optionsList}>
              {currentQ.options?.map((opt) => {
                const isSelected = selectedOption === opt.label;
                const isCorrectOpt = String(opt.label).toUpperCase() === String(currentQ.correctAnswer).toUpperCase();

                let optionStyle = styles.optionItem;
                let textStyle = styles.optionText;

                if (isAnswerSubmitted) {
                  if (isCorrectOpt) {
                    optionStyle = [styles.optionItem, styles.optionCorrect];
                    textStyle = [styles.optionText, styles.textCorrect];
                  } else if (isSelected && !isCorrectOpt) {
                    optionStyle = [styles.optionItem, styles.optionIncorrect];
                    textStyle = [styles.optionText, styles.textIncorrect];
                  }
                } else if (isSelected) {
                  optionStyle = [styles.optionItem, styles.optionSelected];
                  textStyle = [styles.optionText, styles.textSelected];
                }

                return (
                  <TouchableOpacity
                    key={`opt_${opt.label}`}
                    style={optionStyle}
                    onPress={() => !isAnswerSubmitted && setSelectedOption(opt.label)}
                    disabled={isAnswerSubmitted}
                  >
                    <View style={styles.optLabelBox}>
                      <Text style={styles.optLabelText}>{opt.label}</Text>
                    </View>
                    <Text style={textStyle}>{opt.text}</Text>
                    {isAnswerSubmitted && isCorrectOpt ? (
                      <MaterialCommunityIcons name="check-circle" size={20} color="#2E7D32" style={{ marginLeft: "auto" }} />
                    ) : isAnswerSubmitted && isSelected && !isCorrectOpt ? (
                      <MaterialCommunityIcons name="close-circle" size={20} color="#D32F2F" style={{ marginLeft: "auto" }} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Buttons: Submit / Result */}
            {!isAnswerSubmitted ? (
              <TouchableOpacity
                style={[styles.submitBtn, !selectedOption && styles.submitBtnDisabled]}
                onPress={handleSubmitAnswer}
                disabled={!selectedOption}
              >
                <Text style={styles.submitBtnText}>Submit Answer</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.resultBox}>
                {selectedOption === currentQ.correctAnswer ? (
                  <View style={styles.resultBannerCorrect}>
                    <MaterialCommunityIcons name="check-decagram" size={22} color="#2E7D32" />
                    <Text style={styles.resultTextCorrect}>✓ Correct Answer!</Text>
                  </View>
                ) : (
                  <View style={styles.resultBannerIncorrect}>
                    <MaterialCommunityIcons name="alert-circle" size={22} color="#D32F2F" />
                    <Text style={styles.resultTextIncorrect}>✗ Incorrect. Correct Answer is Option {currentQ.correctAnswer}</Text>
                  </View>
                )}

                {/* On-Demand Groq AI Explanation Button */}
                <TouchableOpacity style={styles.aiExplainBtn} onPress={() => handleExplainWithAI(aiLanguage)}>
                  {aiLoading ? (
                    <ActivityIndicator color="#5B3CF5" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="sparkles" size={20} color="#5B3CF5" />
                      <Text style={styles.aiExplainBtnText}>Explain with AI (Groq AI) ✨</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* AI EXPLANATION SECTION */}
            {aiExplanation ? (
              <View style={styles.aiExplanationCard}>
                <View style={styles.aiHeaderRow}>
                  <MaterialCommunityIcons name="robot" size={22} color="#5B3CF5" />
                  <Text style={styles.aiHeaderTitle}>Groq AI Detailed Explanation</Text>
                </View>

                {/* Language Selector Chips */}
                <View style={styles.langSelectorRow}>
                  <Text style={styles.langLabel}>Language:</Text>
                  {["en", "hi", "hinglish"].map((lang) => (
                    <TouchableOpacity
                      key={`lang_${lang}`}
                      style={[styles.langChip, aiLanguage === lang && styles.langChipActive]}
                      onPress={() => {
                        setAiLanguage(lang);
                        handleExplainWithAI(lang);
                      }}
                    >
                      <Text style={[styles.langChipText, aiLanguage === lang && styles.langChipTextActive]}>
                        {lang === "en" ? "English" : lang === "hi" ? "Hindi" : "Hinglish"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <ScrollView style={styles.aiBodyScroll} nestedScrollEnabled={true}>
                  <Text style={styles.aiContentText}>{aiExplanation.detailedExplanation}</Text>

                  {/* Follow-up Questions History */}
                  {followUpResponses.map((item, fIdx) => (
                    <View key={`fup_${fIdx}`} style={styles.followUpItem}>
                      <Text style={styles.followUpQueryText}>Q: {item.query}</Text>
                      <Text style={styles.followUpAnsText}>{item.text}</Text>
                    </View>
                  ))}
                </ScrollView>

                {/* Interactive Follow-up Input */}
                <View style={styles.followUpInputRow}>
                  <TextInput
                    style={styles.followUpInput}
                    placeholder="Ask follow-up (e.g. shortcut method, Hindi explanation)..."
                    placeholderTextColor="#94A3B8"
                    value={followUpQuery}
                    onChangeText={setFollowUpQuery}
                  />
                  <TouchableOpacity
                    style={styles.sendFollowUpBtn}
                    onPress={() => followUpQuery.trim() && handleExplainWithAI(aiLanguage, followUpQuery.trim())}
                  >
                    <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>

          {/* Navigation Controls */}
          <View style={styles.navControlsRow}>
            <TouchableOpacity
              style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
              onPress={handlePrevQuestion}
              disabled={currentIndex === 0}
            >
              <MaterialCommunityIcons name="chevron-left" size={20} color="#1E293B" />
              <Text style={styles.navBtnText}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exitBtn} onPress={() => setInPractice(false)}>
              <Text style={styles.exitBtnText}>Exit Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnPrimary, currentIndex === questions.length - 1 && styles.navBtnDisabled]}
              onPress={handleNextQuestion}
              disabled={currentIndex === questions.length - 1}
            >
              <Text style={styles.navBtnPrimaryText}>Next Question</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* VIEW 3: SAVED QUESTIONS */}
      {activeTab === "saved" ? (
        <View style={styles.savedSection}>
          <Text style={styles.sectionHeading}>Your Saved Government Questions ({savedQuestions.length})</Text>
          {savedQuestions.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="bookmark-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No saved questions yet</Text>
              <Text style={styles.emptySub}>Bookmark questions during practice to review them anytime here.</Text>
            </View>
          ) : (
            savedQuestions.map((q, idx) => (
              <View key={`sq_${idx}`} style={styles.savedCard}>
                <Text style={styles.savedCardExam}>{q.examName} ({q.year}) • {q.subjectName}</Text>
                <Text style={styles.savedCardText}>{q.questionText}</Text>
                <Text style={styles.savedCardAns}>Correct Answer: Option {q.correctAnswer}</Text>
              </View>
            ))
          )}
        </View>
      ) : null}

      {/* VIEW 4: PROGRESS & ANALYTICS DASHBOARD */}
      {activeTab === "progress" ? (
        <View style={styles.progressSection}>
          <Text style={styles.sectionHeading}>Practice Analytics & Accuracy</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statVal}>{progressData?.totalAttempted || 0}</Text>
              <Text style={styles.statLbl}>Total Attempted</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statVal, { color: "#2E7D32" }]}>{progressData?.correctCount || 0}</Text>
              <Text style={styles.statLbl}>Correct</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statVal, { color: "#D32F2F" }]}>{progressData?.incorrectCount || 0}</Text>
              <Text style={styles.statLbl}>Incorrect</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statVal, { color: "#5B3CF5" }]}>{progressData?.accuracy || 0}%</Text>
              <Text style={styles.statLbl}>Accuracy Rate</Text>
            </View>
          </View>

          {/* Subject Breakdown */}
          {progressData?.subjectBreakdown?.length ? (
            <View style={styles.subjectBreakdownCard}>
              <Text style={styles.breakdownTitle}>Subject-Wise Accuracy</Text>
              {progressData.subjectBreakdown.map((s, sIdx) => (
                <View key={`sb_${sIdx}`} style={styles.sbRow}>
                  <Text style={styles.sbName}>{s.subject}</Text>
                  <View style={styles.sbBarBg}>
                    <View style={[styles.sbBarFill, { width: `${s.accuracy}%` }]} />
                  </View>
                  <Text style={styles.sbPct}>{s.accuracy}%</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60
  },
  topHeader: {
    marginBottom: 16
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  titleBox: {},
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EDFF",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5B3CF5",
    marginLeft: 4
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4
  },
  subTitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10
  },
  tabItemActive: {
    backgroundColor: "#F0EDFF"
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginLeft: 6
  },
  tabLabelActive: {
    color: "#5B3CF5"
  },
  setupCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8
  },
  categoryRow: {
    flexDirection: "row",
    marginBottom: 8
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8
  },
  catChipActive: {
    backgroundColor: "#5B3CF5"
  },
  catChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569"
  },
  catChipTextActive: {
    color: "#FFFFFF"
  },
  examScroll: {
    flexDirection: "row",
    marginBottom: 8
  },
  examCard: {
    width: 130,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 10,
    alignItems: "center"
  },
  examCardSelected: {
    backgroundColor: "#F0EDFF",
    borderColor: "#5B3CF5"
  },
  examCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 6,
    textAlign: "center"
  },
  examCardTitleSelected: {
    color: "#5B3CF5"
  },
  examCardSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  yearChipSelected: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  yearText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155"
  },
  yearTextSelected: {
    color: "#FFFFFF"
  },
  emptyTextNote: {
    fontSize: 12,
    color: "#64748B",
    fontStyle: "italic"
  },
  chipRow: {
    flexDirection: "row",
    marginBottom: 8
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    marginRight: 8
  },
  filterChipActive: {
    backgroundColor: "#1E293B"
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569"
  },
  filterChipTextActive: {
    color: "#FFFFFF"
  },
  limitChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  limitChipSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32"
  },
  limitText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155"
  },
  limitTextSelected: {
    color: "#FFFFFF"
  },
  availableCounterBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 10,
    marginTop: 16
  },
  availableCounterText: {
    fontSize: 13,
    color: "#1B5E20",
    marginLeft: 8
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B3CF5",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16
  },
  startBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginRight: 8
  },

  // Practice Screen Styles
  practiceContainer: {},
  practiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  practiceExamBadge: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A"
  },
  practiceSubjectBadge: {
    fontSize: 12,
    color: "#64748B"
  },
  counterBadge: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  counterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5B3CF5"
  },
  progressBg: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    marginBottom: 16,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#5B3CF5"
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  typePyq: { backgroundColor: "#FEF3C7" },
  typeMock: { backgroundColor: "#E0F2FE" },
  typePractice: { backgroundColor: "#F3E8FF" },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E293B"
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center"
  },
  saveBtnText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 4
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16
  },
  questionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 24,
    marginBottom: 16
  },
  optionsList: {
    gap: 10,
    marginBottom: 16
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12
  },
  optionSelected: {
    backgroundColor: "#F0EDFF",
    borderColor: "#5B3CF5"
  },
  optionCorrect: {
    backgroundColor: "#E8F5E9",
    borderColor: "#2E7D32"
  },
  optionIncorrect: {
    backgroundColor: "#FFEBEE",
    borderColor: "#D32F2F"
  },
  optLabelBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  optLabelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B"
  },
  optionText: {
    fontSize: 14,
    color: "#334155",
    flex: 1
  },
  textSelected: { fontWeight: "700", color: "#5B3CF5" },
  textCorrect: { fontWeight: "700", color: "#2E7D32" },
  textIncorrect: { fontWeight: "700", color: "#D32F2F" },
  submitBtn: {
    backgroundColor: "#5B3CF5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center"
  },
  submitBtnDisabled: {
    backgroundColor: "#CBD5E1"
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  resultBox: {
    marginTop: 8
  },
  resultBannerCorrect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12
  },
  resultTextCorrect: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2E7D32",
    marginLeft: 8
  },
  resultBannerIncorrect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12
  },
  resultTextIncorrect: {
    fontSize: 13,
    fontWeight: "700",
    color: "#D32F2F",
    marginLeft: 8
  },
  aiExplainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0EDFF",
    borderWidth: 1,
    borderColor: "#C4B5FD",
    paddingVertical: 12,
    borderRadius: 12
  },
  aiExplainBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5B3CF5",
    marginLeft: 6
  },
  aiExplanationCard: {
    marginTop: 16,
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    borderRadius: 14,
    padding: 14
  },
  aiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  aiHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5B3CF5",
    marginLeft: 6
  },
  langSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12
  },
  langLabel: {
    fontSize: 11,
    color: "#64748B"
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#E2E8F0"
  },
  langChipActive: {
    backgroundColor: "#5B3CF5"
  },
  langChipText: {
    fontSize: 11,
    color: "#334155"
  },
  langChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  aiBodyScroll: {
    maxHeight: 250,
    marginBottom: 10
  },
  aiContentText: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 20
  },
  followUpItem: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 8,
    marginTop: 8
  },
  followUpQueryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5B3CF5"
  },
  followUpAnsText: {
    fontSize: 12,
    color: "#334155",
    marginTop: 2
  },
  followUpInputRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  followUpInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: "#0F172A",
    marginRight: 8
  },
  sendFollowUpBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#5B3CF5",
    alignItems: "center",
    justifyContent: "center"
  },
  navControlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10
  },
  navBtnDisabled: {
    opacity: 0.4
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B"
  },
  exitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  exitBtnText: {
    fontSize: 12,
    color: "#D32F2F",
    fontWeight: "600"
  },
  navBtnPrimary: {
    backgroundColor: "#5B3CF5",
    borderColor: "#5B3CF5"
  },
  navBtnPrimaryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF"
  },

  // Saved & Progress Styles
  savedSection: {},
  savedCard: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10
  },
  savedCardExam: { fontSize: 11, fontWeight: "700", color: "#5B3CF5" },
  savedCardText: { fontSize: 13, fontWeight: "600", color: "#0F172A", marginVertical: 4 },
  savedCardAns: { fontSize: 12, color: "#2E7D32" },
  emptyBox: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginTop: 10 },
  emptySub: { fontSize: 12, color: "#64748B", textAlign: "center", marginTop: 4 },

  progressSection: {},
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { width: "48%", backgroundColor: "#FFFFFF", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  statVal: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  statLbl: { fontSize: 12, color: "#64748B", marginTop: 2 },
  subjectBreakdownCard: { backgroundColor: "#FFFFFF", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  breakdownTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 12 },
  sbRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sbName: { width: 100, fontSize: 12, color: "#334155" },
  sbBarBg: { flex: 1, height: 8, backgroundColor: "#E2E8F0", borderRadius: 4, marginHorizontal: 8, overflow: "hidden" },
  sbBarFill: { height: "100%", backgroundColor: "#2E7D32" },
  sbPct: { width: 36, fontSize: 12, fontWeight: "700", color: "#2E7D32" }
});
