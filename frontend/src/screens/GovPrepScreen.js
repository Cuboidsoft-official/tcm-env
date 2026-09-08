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

const DEFAULT_EXAM_LIST = [
  { id: "ex_ssc_cgl", name: "SSC CGL", category: "SSC", description: "Staff Selection Commission Combined Graduate Level", isActive: true },
  { id: "ex_ssc_chsl", name: "SSC CHSL", category: "SSC", description: "Combined Higher Secondary Level Examination", isActive: true },
  { id: "ex_rrb_ntpc", name: "Railway NTPC", category: "Railway", description: "RRB Non-Technical Popular Categories", isActive: true },
  { id: "ex_rrb_groupd", name: "RRB Group D", category: "Railway", description: "Railway Level 1 Recruitment Examination", isActive: true },
  { id: "ex_ibps_po", name: "IBPS PO", category: "Banking", description: "Institute of Banking Personnel Selection PO", isActive: true },
  { id: "ex_sbi_po", name: "SBI PO", category: "Banking", description: "State Bank of India Probationary Officer", isActive: true },
  { id: "ex_upsc_cse", name: "UPSC Civil Services", category: "UPSC", description: "Civil Services Examination General Studies & CSAT", isActive: true },
  { id: "ex_state_psc", name: "State PSC", category: "State PSC", description: "State Public Service Commission General Studies", isActive: true },
  { id: "ex_police", name: "Police Constable", category: "Police", description: "State Police Recruitment Examination", isActive: true },
  { id: "ex_defence", name: "CDS Defence", category: "Defence", description: "Combined Defence Services Examination", isActive: true }
];

const EXAM_CATEGORY_SUBJECTS = {
  SSC: [
    { id: "sub_reasoning", name: "Reasoning", icon: "brain" },
    { id: "sub_quant", name: "Quantitative Aptitude", icon: "calculator" },
    { id: "sub_ga", name: "General Awareness", icon: "book-open" },
    { id: "sub_english", name: "English Comprehension", icon: "format-title" }
  ],
  Railway: [
    { id: "sub_rrb_math", name: "Mathematics", icon: "calculator" },
    { id: "sub_rrb_reasoning", name: "General Intelligence & Reasoning", icon: "brain" },
    { id: "sub_rrb_sci", name: "General Science", icon: "flask" },
    { id: "sub_rrb_ga", name: "General Awareness & Current Affairs", icon: "globe-model" }
  ],
  Banking: [
    { id: "sub_ibps_reasoning", name: "Reasoning Ability", icon: "brain" },
    { id: "sub_ibps_quant", name: "Quantitative Aptitude", icon: "calculator" },
    { id: "sub_ibps_english", name: "English Language", icon: "format-title" },
    { id: "sub_ibps_banking", name: "Banking & Financial Awareness", icon: "bank" }
  ],
  UPSC: [
    { id: "sub_upsc_gs", name: "General Studies (Polity, History, Geo)", icon: "scale-balance" },
    { id: "sub_upsc_csat", name: "CSAT (Aptitude & Comprehension)", icon: "notebook-text" }
  ],
  "State PSC": [
    { id: "sub_psc_gk", name: "State GK & Culture", icon: "map-marker-path" },
    { id: "sub_psc_gs", name: "General Studies & Polity", icon: "bank" },
    { id: "sub_psc_apt", name: "Mental Ability & Aptitude", icon: "brain" }
  ],
  Police: [
    { id: "sub_pol_gk", name: "General Knowledge & Science", icon: "shield-half-full" },
    { id: "sub_pol_reasoning", name: "Reasoning & Mental Ability", icon: "brain" },
    { id: "sub_pol_num", name: "Numerical Ability", icon: "calculator" }
  ],
  Defence: [
    { id: "sub_def_math", name: "Elementary Mathematics", icon: "calculator" },
    { id: "sub_def_eng", name: "English Language", icon: "format-title" },
    { id: "sub_def_gk", name: "General Knowledge & Science", icon: "shield-star" }
  ]
};

const DEFAULT_QUESTIONS = [
  {
    id: "q_ssc_1",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2024,
    subjectId: "sub_reasoning",
    subjectName: "Reasoning",
    topicName: "Analogy",
    type: "pyq",
    questionText: "Book : Read :: Food : ?",
    questionTextHi: "पुस्तक : पढ़ना :: भोजन : ?",
    options: [
      { label: "A", text: "Cook" },
      { label: "B", text: "Eat" },
      { label: "C", text: "Buy" },
      { label: "D", text: "Sell" }
    ],
    optionsHi: [
      { label: "A", text: "पकाना" },
      { label: "B", text: "खाना" },
      { label: "C", text: "खरीदना" },
      { label: "D", text: "बेचना" }
    ],
    correctAnswer: "B",
    explanation: "Just as a 'Book' is meant to be 'Read', 'Food' is meant to be 'Eaten'. Therefore, 'Eat' is the correct relationship.",
    explanationHi: "जिस प्रकार 'पुस्तक' का सम्बन्ध 'पढ़ने' से है, उसी प्रकार 'भोजन' का सम्बन्ध 'खाने' से है।",
    language: "en"
  },
  {
    id: "q_ssc_2",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2024,
    subjectId: "sub_reasoning",
    subjectName: "Reasoning",
    topicName: "Number Series",
    type: "pyq",
    questionText: "Find the missing number in the series: 4, 9, 19, 39, 79, ?",
    questionTextHi: "श्रृंखला में लुप्त संख्या ज्ञात कीजिए: 4, 9, 19, 39, 79, ?",
    options: [
      { label: "A", text: "159" },
      { label: "B", text: "149" },
      { label: "C", text: "169" },
      { label: "D", text: "139" }
    ],
    optionsHi: [
      { label: "A", text: "159" },
      { label: "B", text: "149" },
      { label: "C", text: "169" },
      { label: "D", text: "139" }
    ],
    correctAnswer: "A",
    explanation: "Pattern: Each number is (Previous × 2) + 1. So 79×2+1 = 159.",
    explanationHi: "पैटर्न: प्रत्येक संख्या (पिछली × 2) + 1 है। अतः 79 × 2 + 1 = 159।",
    language: "en"
  },
  {
    id: "q_ssc_3",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2024,
    subjectId: "sub_quant",
    subjectName: "Quantitative Aptitude",
    topicName: "Percentage",
    type: "pyq",
    questionText: "If a number is increased by 20% and then decreased by 20%, what is the net percentage change?",
    questionTextHi: "यदि किसी संख्या में 20% की वृद्धि की जाती है और फिर 20% की कमी की जाती है, तो शुद्ध प्रतिशत परिवर्तन क्या है?",
    options: [
      { label: "A", text: "No change" },
      { label: "B", text: "4% Increase" },
      { label: "C", text: "4% Decrease" },
      { label: "D", text: "2% Decrease" }
    ],
    optionsHi: [
      { label: "A", text: "कोई परिवर्तन नहीं" },
      { label: "B", text: "4% वृद्धि" },
      { label: "C", text: "4% कमी" },
      { label: "D", text: "2% कमी" }
    ],
    correctAnswer: "C",
    explanation: "Net Change = +20 - 20 + (20 × -20)/100 = -4%. A net 4% decrease.",
    explanationHi: "शुद्ध परिवर्तन = +20 - 20 + (20 × -20)/100 = -4% (अर्थात 4% की कमी)।",
    language: "en"
  },
  {
    id: "q_ssc_5",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2024,
    subjectId: "sub_quant",
    subjectName: "Quantitative Aptitude",
    topicName: "Ratio & Proportion",
    type: "pyq",
    questionText: "The ratio of ages of A and B is 3:4. After 5 years, the ratio becomes 4:5. What is the present age of A?",
    questionTextHi: "A और B की आयु का अनुपात 3:4 है। 5 वर्ष बाद अनुपात 4:5 हो जाता है। A की वर्तमान आयु क्या है?",
    options: [
      { label: "A", text: "12 years" },
      { label: "B", text: "15 years" },
      { label: "C", text: "20 years" },
      { label: "D", text: "25 years" }
    ],
    optionsHi: [
      { label: "A", text: "12 वर्ष" },
      { label: "B", text: "15 वर्ष" },
      { label: "C", text: "20 वर्ष" },
      { label: "D", text: "25 वर्ष" }
    ],
    correctAnswer: "B",
    explanation: "Let present ages be 3x and 4x. (3x + 5)/(4x + 5) = 4/5 => 5(3x + 5) = 4(4x + 5) => 15x + 25 = 16x + 20 => x = 5. Present age of A = 3 × 5 = 15 years.",
    explanationHi: "माना आयु 3x और 4x है। (3x + 5)/(4x + 5) = 4/5 => x = 5। A की वर्तमान आयु = 3 × 5 = 15 वर्ष।",
    language: "en"
  },
  {
    id: "q_ssc_4",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2023,
    subjectId: "sub_ga",
    subjectName: "General Awareness",
    topicName: "Indian History",
    type: "pyq",
    questionText: "Who was the founder of the Maurya Empire in ancient India?",
    questionTextHi: "प्राचीन भारत में मौर्य साम्राज्य के संस्थापक कौन थे?",
    options: [
      { label: "A", text: "Ashoka the Great" },
      { label: "B", text: "Chandragupta Maurya" },
      { label: "C", text: "Bindusara" },
      { label: "D", text: "Bimbisara" }
    ],
    optionsHi: [
      { label: "A", text: "सम्राट अशोक" },
      { label: "B", text: "चंद्रगुप्त मौर्य" },
      { label: "C", text: "बिंदुसर" },
      { label: "D", text: "बिंबिसार" }
    ],
    correctAnswer: "B",
    explanation: "Chandragupta Maurya founded the Maurya Empire in 322 BCE.",
    explanationHi: "चंद्रगुप्त मौर्य ने 322 ईसा पूर्व में मौर्य साम्राज्य की स्थापना की थी।",
    language: "en"
  },
  {
    id: "q_ssc_6",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2024,
    subjectId: "sub_ga",
    subjectName: "General Awareness",
    topicName: "Geography",
    type: "pyq",
    questionText: "Which Indian city is famously known as the 'Pink City' of India?",
    questionTextHi: "भारत के किस शहर को 'गुलाबी नगरी' (Pink City) के नाम से जाना जाता है?",
    options: [
      { label: "A", text: "Udaipur" },
      { label: "B", text: "Jaipur" },
      { label: "C", text: "Jodhpur" },
      { label: "D", text: "Jaisalmer" }
    ],
    optionsHi: [
      { label: "A", text: "उदयपुर" },
      { label: "B", text: "जयपुर" },
      { label: "C", text: "जोधपुर" },
      { label: "D", text: "जैसलमेर" }
    ],
    correctAnswer: "B",
    explanation: "Jaipur is known as the Pink City of India due to the distinctive color of its buildings.",
    explanationHi: "जयपुर को इसकी इमारतों के विशिष्ट गुलाबी रंग के कारण गुलाबी नगरी के रूप में जाना जाता है।",
    language: "en"
  },
  {
    id: "q_ssc_7",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2024,
    subjectId: "sub_english",
    subjectName: "English Comprehension",
    topicName: "Vocabulary",
    type: "pyq",
    questionText: "Select the most appropriate SYNONYM of the word 'BENEVOLENT':",
    questionTextHi: "'BENEVOLENT' शब्द का सबसे उपयुक्त पर्यायवाची (Synonym) चुनिए:",
    options: [
      { label: "A", text: "Cruel" },
      { label: "B", text: "Kind" },
      { label: "C", text: "Greedy" },
      { label: "D", text: "Hateful" }
    ],
    optionsHi: [
      { label: "A", text: "Cruel (क्रूर)" },
      { label: "B", text: "Kind (दयालु)" },
      { label: "C", text: "Greedy (लालची)" },
      { label: "D", text: "Hateful (घृणास्पद)" }
    ],
    correctAnswer: "B",
    explanation: "'Benevolent' means well-meaning and kindly. Therefore, 'Kind' is the correct synonym.",
    explanationHi: "'Benevolent' का अर्थ दयालु/परोपकारी होता है। अतः 'Kind' सही उत्तर है।",
    language: "en"
  },
  {
    id: "q_ssc_8",
    examId: "ex_ssc_cgl",
    examName: "SSC CGL",
    year: 2024,
    subjectId: "sub_english",
    subjectName: "English Comprehension",
    topicName: "Spelling",
    type: "pyq",
    questionText: "Select the correctly spelt word:",
    questionTextHi: "सही वर्तनी (Correct Spelling) वाला शब्द चुनिए:",
    options: [
      { label: "A", text: "Recieve" },
      { label: "B", text: "Receive" },
      { label: "C", text: "Receave" },
      { label: "D", text: "Receeve" }
    ],
    optionsHi: [
      { label: "A", text: "Recieve" },
      { label: "B", text: "Receive" },
      { label: "C", text: "Receave" },
      { label: "D", text: "Receeve" }
    ],
    correctAnswer: "B",
    explanation: "The correct spelling is 'Receive' (rule: 'i' before 'e' except after 'c').",
    explanationHi: "सही वर्तनी 'Receive' है।",
    language: "en"
  },
  {
    id: "q_rrb_1",
    examId: "ex_rrb_ntpc",
    examName: "Railway NTPC",
    year: 2024,
    subjectId: "sub_rrb_sci",
    subjectName: "General Science",
    topicName: "Physics",
    type: "pyq",
    questionText: "What is the SI unit of electrical resistance?",
    questionTextHi: "विद्युत प्रतिरोध का SI मात्रक क्या है?",
    options: [
      { label: "A", text: "Volt" },
      { label: "B", text: "Ampere" },
      { label: "C", text: "Ohm" },
      { label: "D", text: "Watt" }
    ],
    optionsHi: [
      { label: "A", text: "वोल्ट" },
      { label: "B", text: "एम्पीयर" },
      { label: "C", text: "ओम (Ohm)" },
      { label: "D", text: "वाट" }
    ],
    correctAnswer: "C",
    explanation: "The SI unit of electrical resistance is Ohm (Ω).",
    explanationHi: "विद्युत प्रतिरोध का SI मात्रक ओम (Ohm - Ω) होता है।",
    language: "en"
  },
  {
    id: "q_upsc_1",
    examId: "ex_upsc_cse",
    examName: "UPSC Civil Services",
    year: 2024,
    subjectId: "sub_upsc_polity",
    subjectName: "General Studies",
    topicName: "Indian Polity",
    type: "pyq",
    questionText: "Which Article of the Indian Constitution guarantees 'Equality before Law'?",
    questionTextHi: "भारतीय संविधान का कौन सा अनुच्छेद 'विधि के समक्ष समता' की गारंटी देता है?",
    options: [
      { label: "A", text: "Article 12" },
      { label: "B", text: "Article 14" },
      { label: "C", text: "Article 19" },
      { label: "D", text: "Article 21" }
    ],
    optionsHi: [
      { label: "A", text: "अनुच्छेद 12" },
      { label: "B", text: "अनुच्छेद 14" },
      { label: "C", text: "अनुच्छेद 19" },
      { label: "D", text: "अनुच्छेद 21" }
    ],
    correctAnswer: "B",
    explanation: "Article 14 guarantees equality before law and equal protection of laws to all persons within India.",
    explanationHi: "अनुच्छेद 14 भारत के सभी नागरिकों को कानून के समक्ष समानता की गारंटी देता है।",
    language: "en"
  }
];

export default function GovPrepScreen({ session, user, onBack }) {
  const { theme } = useTheme();

  // Primary Data State
  const [loading, setLoading] = useState(true);
  const [practiceLoading, setPracticeLoading] = useState(false);
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
  const [selectedLanguage, setSelectedLanguage] = useState("en");

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

      const fetchedCats = catRes?.categories || [];
      const catList = fetchedCats.length > 0 ? fetchedCats : ["All", "SSC", "Railway", "Banking", "UPSC", "State PSC", "Police", "Defence"];
      setCategories(catList);

      const fetchedExams = examRes?.exams || [];
      const examList = fetchedExams.length > 0 ? fetchedExams : DEFAULT_EXAM_LIST;
      setAllExams(examList);

      if (examList.length > 0) {
        const firstExam = examList[0];
        setSelectedExam(firstExam);
        loadExamDetails(firstExam.id);
      }
    } catch (err) {
      console.warn("Error loading GovPrep initial data:", err);
      setCategories(["All", "SSC", "Railway", "Banking", "UPSC", "State PSC", "Police", "Defence"]);
      setAllExams(DEFAULT_EXAM_LIST);
      if (DEFAULT_EXAM_LIST.length > 0) {
        setSelectedExam(DEFAULT_EXAM_LIST[0]);
        loadExamDetails(DEFAULT_EXAM_LIST[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  // Filter exams by category
  const filteredExams = useMemo(() => {
    if (!activeCategory || activeCategory === "All") return allExams;
    const filtered = allExams.filter((ex) => (ex.category || "").toLowerCase() === activeCategory.toLowerCase());
    return filtered.length > 0 ? filtered : allExams;
  }, [allExams, activeCategory]);

  async function loadExamDetails(examId) {
    if (!examId) return;
    try {
      const targetExam = allExams.find((ex) => ex.id === examId || ex._id === examId) || selectedExam;
      const catKey = targetExam?.category || "SSC";
      const catSubjects = EXAM_CATEGORY_SUBJECTS[catKey] || EXAM_CATEGORY_SUBJECTS["SSC"];

      const [yearRes, subRes] = await Promise.all([
        getGovYears(examId).catch(() => ({ years: [] })),
        getGovSubjects(examId).catch(() => ({ subjects: [] }))
      ]);

      const yrList = yearRes?.years || [];
      setYears(yrList);
      const defaultYr = yrList.length > 0 ? String(yrList[0]) : "";
      setSelectedYear(defaultYr);

      const fetchedSubs = subRes?.subjects || [];
      const subList = fetchedSubs.length > 0 ? fetchedSubs : catSubjects;
      setSubjects(subList);
      setSelectedSubject(null);
      setSelectedTopic(null);
      setTopics([]);

      updateAvailableCount(examId, defaultYr, null, null);
    } catch (e) {
      console.warn("Error loading exam details:", e);
      setSubjects(EXAM_CATEGORY_SUBJECTS["SSC"]);
    }
  }

  function handleCategoryChange(catName) {
    setActiveCategory(catName);
    const available = catName === "All" ? allExams : allExams.filter((ex) => (ex.category || "").toLowerCase() === catName.toLowerCase());
    const listToUse = available.length > 0 ? available : allExams;
    if (listToUse.length > 0) {
      setSelectedExam(listToUse[0]);
      loadExamDetails(listToUse[0].id);
    } else {
      setSelectedExam(null);
      setYears([]);
      setSubjects(DEFAULT_SUBJECTS);
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
    setPracticeLoading(true);
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

      let res = await getGovQuestions(params).catch(() => ({ questions: [] }));
      let qList = res?.questions || [];

      // If specific combination returned 0, retry without strict filters
      if (qList.length === 0) {
        const fallbackRes = await getGovQuestions({ limit: params.limit || 20 }).catch(() => ({ questions: [] }));
        qList = fallbackRes?.questions || [];
      }

      // If network/API returns 0 questions, use DEFAULT_QUESTIONS fallback filtered by subject
      if (qList.length === 0) {
        if (selectedSubject?.id) {
          const filteredBySub = DEFAULT_QUESTIONS.filter((q) => q.subjectId === selectedSubject.id || q.subjectName === selectedSubject.name);
          qList = filteredBySub.length > 0 ? filteredBySub : DEFAULT_QUESTIONS;
        } else {
          qList = DEFAULT_QUESTIONS;
        }
      }

      const formattedQuestions = qList.map((q) => ({
        ...q,
        examName: q.examName || selectedExam?.name || "Government Exam",
        subjectName: q.subjectName || selectedSubject?.name || "General Practice Paper"
      }));

      setQuestions(formattedQuestions);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setAiExplanation(null);
      setFollowUpResponses([]);
      setInPractice(true);
    } catch (err) {
      const filteredBySub = selectedSubject?.id
        ? DEFAULT_QUESTIONS.filter((q) => q.subjectId === selectedSubject.id || q.subjectName === selectedSubject.name)
        : DEFAULT_QUESTIONS;
      const finalQList = filteredBySub.length > 0 ? filteredBySub : DEFAULT_QUESTIONS;

      const formattedQuestions = finalQList.map((q) => ({
        ...q,
        examName: selectedExam?.name || "Government Exam",
        subjectName: selectedSubject?.name || "General Practice Paper"
      }));
      setQuestions(formattedQuestions);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setAiExplanation(null);
      setFollowUpResponses([]);
      setInPractice(true);
    } finally {
      setPracticeLoading(false);
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

  const displayQuestionText = currentQ ? (selectedLanguage === "hi" && currentQ.questionTextHi ? currentQ.questionTextHi : currentQ.questionText) : "";
  const displayOptions = currentQ ? (selectedLanguage === "hi" && currentQ.optionsHi ? currentQ.optionsHi : currentQ.options) : [];
  const displayExplanation = currentQ ? (selectedLanguage === "hi" && currentQ.explanationHi ? currentQ.explanationHi : currentQ.explanation) : "";

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.bg }]}>
      {/* Dynamic Header */}
      <View style={[styles.headerContainer, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity style={[styles.backIconBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]} onPress={onBack}>
            <Feather name="arrow-left" size={18} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerTitleText, { color: theme.text }]}>Government Exam Prep</Text>
          </View>
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
          <MaterialCommunityIcons name="compass-outline" size={14} color={activeTab === "practice" ? "#DC2626" : theme.subtext} />
          <Text style={[styles.tabButtonText, { color: activeTab === "practice" ? "#DC2626" : theme.subtext }, activeTab === "practice" && styles.tabButtonTextActive]}>
            Exam Setup
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabButton, activeTab === "saved" && styles.tabButtonActive]} onPress={loadSavedTab}>
          <MaterialCommunityIcons name="bookmark-check-outline" size={14} color={activeTab === "saved" ? "#DC2626" : theme.subtext} />
          <Text style={[styles.tabButtonText, { color: activeTab === "saved" ? "#DC2626" : theme.subtext }, activeTab === "saved" && styles.tabButtonTextActive]}>
            Saved ({savedIds.length || savedQuestions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabButton, activeTab === "progress" && styles.tabButtonActive]} onPress={loadProgressTab}>
          <MaterialCommunityIcons name="chart-bar" size={14} color={activeTab === "progress" ? "#DC2626" : theme.subtext} />
          <Text style={[styles.tabButtonText, { color: activeTab === "progress" ? "#DC2626" : theme.subtext }, activeTab === "progress" && styles.tabButtonTextActive]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* BODY CONTENT SCROLLVIEW */}
      {loading ? (
        <View style={styles.fullscreenLoadingBox}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={[styles.fullscreenLoadingText, { color: theme.text }]}>
            Loading Government Exams & Question Bank...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollBodyContent} showsVerticalScrollIndicator={false}>
        {/* VIEW 1: EXAM SETUP & FILTER SELECTION */}
        {activeTab === "practice" && !inPractice ? (
          <View style={styles.setupMainWrapper}>
            {/* Step 1: Exam Category Selector */}
            <View style={styles.stepSectionHeader}>
              <Text style={[styles.stepNumberBadge, { backgroundColor: "#DC2626" }]}>1</Text>
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
              <Text style={[styles.stepNumberBadge, { backgroundColor: "#DC2626" }]}>2</Text>
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
                        isSelected && [styles.examCardBoxSelected, { backgroundColor: theme.isDark ? "#450A0A" : "#FEF2F2" }]
                      ]}
                      onPress={() => handleSelectExam(ex)}
                    >
                      <View style={styles.examCardTopRow}>
                        <View style={[styles.examIconCircle, { backgroundColor: isSelected ? "#DC2626" : theme.isDark ? "#1E293B" : "#F1F5F9" }]}>
                          <MaterialCommunityIcons name={iconName} size={20} color={isSelected ? "#FFFFFF" : "#DC2626"} />
                        </View>
                        {isSelected ? (
                          <MaterialCommunityIcons name="check-circle" size={20} color="#DC2626" />
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
                  <Text style={[styles.stepNumberBadge, { backgroundColor: "#DC2626" }]}>3</Text>
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
                          <MaterialCommunityIcons name="calendar-check" size={14} color={isYrSelected ? "#FFFFFF" : "#DC2626"} />
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
                      <Text style={[styles.stepNumberBadge, { backgroundColor: "#DC2626" }]}>4</Text>
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
                            <MaterialCommunityIcons name="book-open-variant" size={14} color={isSubSelected ? "#FFFFFF" : "#DC2626"} />
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
                  <Text style={[styles.stepNumberBadge, { backgroundColor: "#DC2626" }]}>5</Text>
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

                {/* Step 6: Question Language (Optional) */}
                <View style={[styles.stepSectionHeader, { marginTop: 22 }]}>
                  <Text style={[styles.stepNumberBadge, { backgroundColor: "#DC2626" }]}>6</Text>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>Question Language (भाषा चुनिए)</Text>
                </View>

                <View style={styles.pillsWrapRow}>
                  <TouchableOpacity
                    style={[
                      styles.limitPill,
                      { backgroundColor: theme.cardBg, borderColor: theme.border },
                      selectedLanguage === "en" && styles.limitPillActive
                    ]}
                    onPress={() => {
                      setSelectedLanguage("en");
                      setAiLanguage("en");
                    }}
                  >
                    <Text style={[styles.limitPillText, { color: theme.text }, selectedLanguage === "en" && styles.limitPillTextActive]}>
                      🇬🇧 English Medium
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.limitPill,
                      { backgroundColor: theme.cardBg, borderColor: theme.border },
                      selectedLanguage === "hi" && styles.limitPillActive
                    ]}
                    onPress={() => {
                      setSelectedLanguage("hi");
                      setAiLanguage("hi");
                    }}
                  >
                    <Text style={[styles.limitPillText, { color: theme.text }, selectedLanguage === "hi" && styles.limitPillTextActive]}>
                      🇮🇳 हिंदी माध्यम (Hindi)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Live Setup Summary Banner */}
                <View style={[styles.summaryBannerCard, { backgroundColor: theme.isDark ? "#450A0A" : "#FEF2F2", borderColor: "#FCA5A5" }]}>
                  <View style={styles.summaryTopRow}>
                    <MaterialCommunityIcons name="target" size={20} color="#DC2626" />
                    <Text style={styles.summaryTargetHeading}>SESSION CONFIGURATION</Text>
                  </View>

                  <Text style={[styles.summaryTitle, { color: theme.isDark ? "#FFFFFF" : "#0F172A" }]}>
                    {selectedExam.name} • {selectedYear ? `${selectedYear} PYQ` : "All Years"}
                  </Text>
                  <Text style={[styles.summarySubText, { color: theme.isDark ? "#CBD5E1" : "#475569" }]}>
                    Subject: {selectedSubject ? selectedSubject.name : "All Subjects"} • Lang: {selectedLanguage === "hi" ? "Hindi" : "English"} • Limit: {questionCountLimit === "all" ? "All Available" : `${questionCountLimit} Questions`}
                  </Text>

                  <View style={styles.availableCounterBadge}>
                    <MaterialCommunityIcons name="check-decagram" size={16} color="#059669" />
                    <Text style={styles.availableCounterBadgeText}>
                      <Text style={{ fontWeight: "700" }}>{availableCount.toLocaleString()}</Text> Questions Active in Database
                    </Text>
                  </View>

                  {/* Start Practice CTA */}
                  <TouchableOpacity style={styles.startPracticeBtnCTA} onPress={handleStartPractice} disabled={practiceLoading}>
                    {practiceLoading ? (
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
            {/* Header Progress, Exit & Live Language Toggle */}
            <View style={[styles.practiceTopNav, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <TouchableOpacity style={styles.exitSessionBtn} onPress={() => setInPractice(false)}>
                <Feather name="x" size={18} color={theme.text} />
                <Text style={[styles.exitSessionText, { color: theme.text }]}>Exit</Text>
              </TouchableOpacity>

              <View style={styles.progressCounterBox}>
                <Text style={[styles.progressCounterText, { color: theme.text }]}>
                  Q<Text style={{ color: "#DC2626", fontWeight: "700" }}>{currentIndex + 1}</Text>/{questions.length}
                </Text>
              </View>

              {/* Live Language Switcher: EN | Hindi */}
              <View style={[styles.langToggleHeaderBox, { borderColor: theme.border, backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}>
                <TouchableOpacity
                  style={[
                    styles.langTogglePill,
                    selectedLanguage === "en" && { backgroundColor: "#DC2626" }
                  ]}
                  onPress={() => {
                    setSelectedLanguage("en");
                    setAiLanguage("en");
                  }}
                >
                  <Text style={[styles.langToggleText, { color: selectedLanguage === "en" ? "#FFFFFF" : theme.subtext }]}>EN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.langTogglePill,
                    selectedLanguage === "hi" && { backgroundColor: "#DC2626" }
                  ]}
                  onPress={() => {
                    setSelectedLanguage("hi");
                    setAiLanguage("hi");
                  }}
                >
                  <Text style={[styles.langToggleText, { color: selectedLanguage === "hi" ? "#FFFFFF" : theme.subtext }]}>हिंदी</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.bookmarkHeaderBtn} onPress={() => handleToggleSaveQuestion(currentQ)}>
                <MaterialCommunityIcons
                  name={isSavedCurrent ? "bookmark" : "bookmark-outline"}
                  size={22}
                  color={isSavedCurrent ? "#DC2626" : theme.subtext}
                />
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            </View>

            {/* Meta Tags Row */}
            <View style={styles.questionMetaRow}>
              <View style={[styles.metaBadge, { backgroundColor: "#FEF2F2" }]}>
                <Text style={[styles.metaBadgeText, { color: "#DC2626" }]}>{currentQ.examName || selectedExam?.name}</Text>
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
                Q{currentIndex + 1}. {displayQuestionText}
              </Text>

              {/* Options List */}
              <View style={styles.optionsListContainer}>
                {displayOptions?.map((opt) => {
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
                    borderStyle = "#DC2626";
                    bgStyle = theme.isDark ? "#450A0A" : "#FEF2F2";
                    circleBg = "#DC2626";
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

                  {/* Solution & Explanation Box */}
                  {displayExplanation ? (
                    <View style={[styles.explanationCard, { backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC", borderColor: theme.border }]}>
                      <Text style={[styles.explanationHeadingText, { color: theme.text }]}>Solution / व्याख्या:</Text>
                      <Text style={[styles.explanationBodyText, { color: theme.subtext }]}>{displayExplanation}</Text>
                    </View>
                  ) : null}

                  {/* Groq AI Explanation Button */}
                  <TouchableOpacity style={styles.aiExplainTriggerBtn} onPress={() => handleExplainWithAI(aiLanguage)}>
                    {aiLoading ? (
                      <ActivityIndicator color="#DC2626" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="sparkles" size={18} color="#DC2626" />
                        <Text style={styles.aiExplainTriggerBtnText}>Explain with Groq AI ✨</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* GROQ AI EXPLANATION SECTION */}
              {aiExplanation ? (
                <View style={[styles.aiExplanationWrapper, { backgroundColor: theme.isDark ? "#450A0A" : "#FFF1F2", borderColor: "#FECACA" }]}>
                  <View style={styles.aiCardHeaderRow}>
                    <View style={styles.aiRobotBadge}>
                      <MaterialCommunityIcons name="robot" size={18} color="#DC2626" />
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
                <Text style={[styles.statQuadValue, { color: "#DC2626" }]}>{progressData?.accuracy || 0}%</Text>
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
      )}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1
  },
  headerLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  backIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitleBox: {},
  headerTitleText: {
    fontSize: 13.5,
    fontFamily: fonts.bold
  },

  // Main Tab Switcher
  tabBarContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    gap: 4
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 8
  },
  tabButtonActive: {
    backgroundColor: "#FEF2F2"
  },
  tabButtonText: {
    fontSize: 11,
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
    backgroundColor: "#DC2626",
    borderColor: "#DC2626"
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
    borderColor: "#DC2626",
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
    color: "#DC2626"
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
    backgroundColor: "#DC2626",
    borderColor: "#DC2626"
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
    backgroundColor: "#DC2626",
    borderColor: "#DC2626"
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
    backgroundColor: "#DC2626",
    borderColor: "#DC2626"
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
    color: "#DC2626",
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
    backgroundColor: "#DC2626",
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
    backgroundColor: "#DC2626"
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
    backgroundColor: "#DC2626",
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
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    paddingVertical: 10,
    borderRadius: 10
  },
  aiExplainTriggerBtnText: {
    color: "#DC2626",
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
    color: "#DC2626"
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
    backgroundColor: "#DC2626"
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
    color: "#DC2626"
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
    backgroundColor: "#DC2626",
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
    backgroundColor: "#DC2626",
    borderColor: "#DC2626"
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
    color: "#DC2626"
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
    backgroundColor: "#DC2626"
  },
  subjectBreakdownPct: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: "#DC2626",
    width: 36,
    textAlign: "right"
  },

  fullscreenLoadingBox: {
    flex: 1,
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center"
  },
  fullscreenLoadingText: {
    marginTop: 14,
    fontSize: 13.5,
    fontFamily: fonts.medium
  },

  langToggleHeaderBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 2,
    borderRadius: 16,
    borderWidth: 1,
    gap: 2
  },
  langTogglePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  langToggleText: {
    fontSize: 10.5,
    fontFamily: fonts.bold
  },

  explanationCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 10
  },
  explanationHeadingText: {
    fontSize: 12.5,
    fontFamily: fonts.bold,
    marginBottom: 4
  },
  explanationBodyText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 18
  }
});
