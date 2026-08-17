import { useState, useEffect, useRef } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Share,
  Platform
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";
import { generateAiExamQuestionsForSkills } from "../api/gemini";

const { width, height } = Dimensions.get("window");

// Toptal, GeeksforGeeks, LeetCode & Top Interview Standard Question Bank
const QUESTION_BANKS = {
  "NEET & Medical": [
    {
      id: "n101",
      skillTag: "Cell Biology",
      question: "According to Peter Mitchell's Chemiosmotic Hypothesis, what directly drives ATP synthesis in mitochondria?",
      snippet: "// Bioenergetics - ATP Synthase (F0-F1 Complex)\nProtons (H+) flow from intermembrane space to matrix.",
      options: [
        "Proton gradient across inner mitochondrial membrane",
        "Direct transfer of phosphate from Glucose",
        "Sodium-Potassium ATPase pump activation",
        "Electron absorption by Pyruvate"
      ],
      correctIndex: 0,
      hint: "Protons accumulate in the intermembrane space and flow through the F1 channel."
    },
    {
      id: "n102",
      skillTag: "Genetics",
      question: "In CRISPR-Cas9 gene editing technology, what component guides the Cas9 nuclease to the target DNA sequence?",
      snippet: "// Molecular Biotechnology - CRISPR Cas9 System\nsgRNA contains 20-nucleotide sequence complementary to target.",
      options: ["Single Guide RNA (sgRNA)", "Transfer RNA (tRNA)", "Messenger RNA (mRNA)", "DNA Polymerase III"],
      correctIndex: 0,
      hint: "Synthetic RNA sequence engineered to complement target genomic locus."
    },
    {
      id: "n103",
      skillTag: "Human Anatomy",
      question: "What is the primary physiological mechanism of the Kidney Countercurrent Multiplier System?",
      snippet: "// Renal Physiology - Loop of Henle\nDescending limb permeable to water; ascending limb actively pumps NaCl.",
      options: [
        "Create hyperosmotic medullary interstitium to concentrate urine",
        "Filter glucose directly into renal pelvis",
        "Synthesize Erythropoietin in glomerulus",
        "Maintain isotonic urine in renal cortex"
      ],
      correctIndex: 0,
      hint: "Establishes osmotic gradient in renal medulla so ADH can reabsorb water."
    },
    {
      id: "n104",
      skillTag: "Plant Physiology",
      question: "During C4 photosynthesis, in which specific cells does RuBisCO enzyme fix carbon dioxide?",
      snippet: "// Plant Physiology - Hatch and Slack Pathway\nCO2 initially fixed as Oxaloacetate in mesophyll cells.",
      options: ["Bundle Sheath Cells", "Mesophyll Cells", "Epidermal Cells", "Guard Cells"],
      correctIndex: 0,
      hint: "Kranz anatomy isolates RuBisCO away from oxygen in inner sheath cells."
    },
    {
      id: "n105",
      skillTag: "Endocrinology",
      question: "Which gland secretes Melatonin to regulate circadian rhythm (sleep-wake cycle)?",
      snippet: "// Neuro-Endocrinology - Biological Clocks\nSynthesized from tryptophan in response to darkness.",
      options: ["Pineal Gland", "Pituitary Gland", "Thyroid Gland", "Adrenal Cortex"],
      correctIndex: 0,
      hint: "Small endocrine gland located in the epithalamus near center of brain."
    }
  ],
  "JEE & Engineering": [
    {
      id: "j101",
      skillTag: "Physics",
      question: "According to the Parallel Axis Theorem, what is the Moment of Inertia (I) of a body about any parallel axis?",
      snippet: "// Classical Mechanics - Rigid Body Dynamics\nI = I_cm + M * d^2",
      options: ["I = I_cm + M * d^2", "I = I_cm - M * d^2", "I = I_cm * d^2", "I = I_cm / M"],
      correctIndex: 0,
      hint: "Sum of moment of inertia about center of mass plus product of total mass and square of distance."
    },
    {
      id: "j102",
      skillTag: "Calculus",
      question: "What is the evaluation of limit lim (x->0) (e^x - 1 - x) / x^2 using L'Hopital's Rule?",
      snippet: "// Advanced Calculus - Indeterminate Forms (0/0)\nDifferentiate numerator and denominator twice.",
      options: ["1/2", "1", "0", "2"],
      correctIndex: 0,
      hint: "First derivative gives (e^x - 1)/(2x). Second derivative gives e^x / 2."
    },
    {
      id: "j103",
      skillTag: "Physics",
      question: "Lenz's Law of Electromagnetic Induction is a direct consequence of which fundamental conservation law?",
      snippet: "// Electromagnetism - Faraday & Lenz Laws\nInduced current opposes the change in magnetic flux.",
      options: ["Law of Conservation of Energy", "Law of Conservation of Charge", "Law of Conservation of Momentum", "Law of Mass Conservation"],
      correctIndex: 0,
      hint: "Mechanical work done against opposing magnetic force converts to electrical energy."
    },
    {
      id: "j104",
      skillTag: "Organic Chemistry",
      question: "Which reaction mechanism produces racemic mixture (50% inversion + 50% retention) in alkyl halides?",
      snippet: "// Organic Reaction Mechanisms - Substitution\nFormation of planar carbocation intermediate.",
      options: ["SN1 Mechanism", "SN2 Mechanism", "E2 Elimination", "Electrophilic Addition"],
      correctIndex: 0,
      hint: "Stepwise reaction where nucleophile attacks planar carbocation from either side."
    }
  ],
  "Govt Exams & UPSC": [
    {
      id: "g101",
      skillTag: "Polity",
      question: "By which Constitutional Amendment Act were the Fundamental Duties incorporated into Part IV-A of the Indian Constitution?",
      snippet: "// Indian Polity - Swaran Singh Committee Recommendation\nArticle 51A inserted under Part IV-A.",
      options: ["42nd Amendment Act 1976", "44th Amendment Act 1978", "86th Amendment Act 2002", "73rd Amendment Act 1992"],
      correctIndex: 0,
      hint: "Enacted during Emergency era on recommendations of Swaran Singh Committee."
    },
    {
      id: "g102",
      skillTag: "Reasoning",
      question: "What is the difference between Compound Interest and Simple Interest on ₹10,000 at 10% per annum for 2 years?",
      snippet: "// Quantitative Aptitude - Interest Formulas\nDifference = P * (R / 100)^2",
      options: ["₹100", "₹50", "₹200", "₹150"],
      correctIndex: 0,
      hint: "Diff = 10000 * (10/100)^2 = 10000 * 0.01 = 100."
    },
    {
      id: "g103",
      skillTag: "Polity",
      question: "Which writ is issued by High Court or Supreme Court to quash an order passed by a lower court/tribunal without jurisdiction?",
      snippet: "// Constitutional Remedies - Writs under Article 32 & 226\nIssued after order has been passed to nullify decision.",
      options: ["Writ of Certiorari", "Writ of Prohibition", "Writ of Quo-Warranto", "Writ of Habeas Corpus"],
      correctIndex: 0,
      hint: "Certiorari means 'to be certified' and quashes illegal orders already passed."
    }
  ],
  "Coding & IT": [
    {
      id: "c101",
      skillTag: "JavaScript",
      question: "[Toptal JS Interview] What is the exact console output order of the following event loop code?",
      snippet: "console.log(1);\nsetTimeout(() => console.log(2), 0);\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);",
      options: ["1, 4, 3, 2", "1, 2, 3, 4", "1, 4, 2, 3", "3, 1, 4, 2"],
      correctIndex: 0,
      hint: "Synchronous code runs first (1, 4), then Microtask queue (Promise 3), then Macrotask queue (setTimeout 2)."
    },
    {
      id: "c102",
      skillTag: "JavaScript",
      question: "[GeeksforGeeks JS] What will foo() output due to variable hoisting & lexical scope?",
      snippet: "var a = 10;\nfunction foo() {\n  console.log(a);\n  var a = 20;\n}\nfoo();",
      options: ["undefined", "10", "20", "ReferenceError"],
      correctIndex: 0,
      hint: "Inside foo(), local 'var a' is hoisted to top of function scope initialized to undefined."
    },
    {
      id: "c103",
      skillTag: "Python",
      question: "[Toptal Python Interview] What will be printed by the following function call snippet?",
      snippet: "def add_item(val, item_list=[]):\n    item_list.append(val)\n    return item_list\n\nprint(add_item(1))\nprint(add_item(2))",
      options: ["[1] then [1, 2]", "[1] then [2]", "[1, 2] then [1, 2]", "TypeError"],
      correctIndex: 0,
      hint: "Default mutable arguments in Python are evaluated once when function is defined, sharing state across calls."
    },
    {
      id: "c104",
      skillTag: "Python",
      question: "[GeeksforGeeks Python] What is the fundamental difference between 'is' and '==' operators?",
      snippet: "a = [1, 2]\nb = [1, 2]\nprint(a == b, a is b)",
      options: [
        "'==' checks value equality; 'is' checks memory reference identity (id())",
        "'is' checks value equality; '==' checks memory address",
        "Both perform identical checks in Python 3",
        "'is' operates on strings only"
      ],
      correctIndex: 0,
      hint: "a == b is True because contents match, but a is b is False because they reside at different memory addresses."
    },
    {
      id: "c105",
      skillTag: "React",
      question: "[Meta React Interview] How does Automatic Batching in React 18 optimize re-renders?",
      snippet: "fetch('/api').then(() => {\n  setCount(c => c + 1);\n  setFlag(f => !f);\n  // React 18 batches both state updates\n});",
      options: [
        "Batches all state updates inside promises, timeouts, and native handlers into 1 render",
        "Executes 2 separate DOM re-renders synchronously",
        "Disables virtual DOM diffing",
        "Requires manual ReactDOM.flushSync call"
      ],
      correctIndex: 0,
      hint: "React 18 groups multiple state updates regardless of where they originate into single render pass."
    },
    {
      id: "c106",
      skillTag: "Node.js",
      question: "[Toptal Node.js] What is the difference in execution order between process.nextTick() and setImmediate()?",
      snippet: "process.nextTick(() => console.log('A'));\nsetImmediate(() => console.log('B'));",
      options: [
        "process.nextTick fires immediately after current operation before next Event Loop phase; setImmediate fires on Check phase",
        "setImmediate fires before process.nextTick",
        "Both execute concurrently in Worker Threads",
        "setImmediate blocks event loop indefinitely"
      ],
      correctIndex: 0,
      hint: "nextTick queue is processed right after current stack empties, preceding setImmediate timer check phase."
    },
    {
      id: "c107",
      skillTag: "Django",
      question: "[GeeksforGeeks Django] What is the main architectural difference between select_related and prefetch_related in Django ORM?",
      snippet: "Author.objects.select_related('profile')  # JOIN\nBook.objects.prefetch_related('authors')   # Separate query",
      options: [
        "select_related uses SQL JOINs (Single/ForeignKey); prefetch_related does separate SQL queries (ManyToMany)",
        "prefetch_related uses SQL JOINs; select_related does separate queries",
        "select_related only works on MySQL",
        "Both execute identical raw SQL"
      ],
      correctIndex: 0,
      hint: "select_related follows single-valued foreign key via JOINs; prefetch_related executes separate queries for many-to-many."
    },
    {
      id: "c108",
      skillTag: "JavaScript",
      question: "[Toptal JS] What is the key difference between Object.freeze() and Object.seal()?",
      snippet: "const obj1 = Object.freeze({ a: 1 });\nconst obj2 = Object.seal({ b: 2 });",
      options: [
        "freeze prevents modifying existing values & adding properties; seal allows modifying existing properties",
        "seal prevents modifying existing values; freeze allows it",
        "Both functions behave identically",
        "seal deletes all prototype properties"
      ],
      correctIndex: 0,
      hint: "Object.seal prevents adding/deleting properties but allows updating existing writable property values."
    },
    {
      id: "c109",
      skillTag: "React",
      question: "[Top Company React] What is the primary purpose of the useCallback hook in React?",
      snippet: "const memoizedCallback = useCallback(() => {\n  doSomething(a, b);\n}, [a, b]);",
      options: [
        "Returns memoized callback instance to prevent unnecessary child component re-renders",
        "Caches expensive calculation result values",
        "Manages global Redux store state",
        "Synchronizes local storage"
      ],
      correctIndex: 0,
      hint: "Prevents re-creating function reference on every render when passed as prop to memoized children."
    },
    {
      id: "c110",
      skillTag: "Python",
      question: "[Toptal Python] How do Generator Expressions differ from List Comprehensions in Python?",
      snippet: "gen = (x * 2 for x in range(1000000))  # Generator\nlst = [x * 2 for x in range(1000000)]  # List",
      options: [
        "Generators yield values lazily on-demand using O(1) memory; lists allocate full array in memory",
        "List comprehensions are lazy; generators allocate memory immediately",
        "Generators cannot be iterated in for loops",
        "List comprehensions are forbidden in Python 3"
      ],
      correctIndex: 0,
      hint: "Generators return an iterator object yielding one item at a time with low memory footprint."
    }
  ]
};

// Helper for shuffling array
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function TcmAiExamModal({ visible, onClose, user, onSaveResult }) {
  const { theme } = useTheme();

  // State management
  const [examStarted, setExamStarted] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState("Coding & IT");
  const [selectedSubSkill, setSelectedSubSkill] = useState("All Skills");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [reviewedQuestions, setReviewedQuestions] = useState({});
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(360); // 6 minutes
  const [examFinished, setExamFinished] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [savingResult, setSavingResult] = useState(false);

  const [startCountdown, setStartCountdown] = useState(null);
  const [isGeneratingAiExam, setIsGeneratingAiExam] = useState(false);

  // Persistent seen questions tracking (ZERO REPEATS)
  const [seenQIds, setSeenQIds] = useState(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = localStorage.getItem("tcm_seen_q_ids");
        return stored ? JSON.parse(stored) : [];
      }
    } catch (e) {}
    return [];
  });

  const timerRef = useRef(null);

  // Extract User Profile Skills STRICTLY from user.skills ONLY
  const profileSkills = [];
  if (Array.isArray(user?.skills)) {
    user.skills.forEach((s) => {
      const label = typeof s === "string" ? s : s.name || s.label || s.title;
      if (label && typeof label === "string" && label.trim() && !profileSkills.includes(label.trim())) {
        profileSkills.push(label.trim());
      }
    });
  } else if (typeof user?.skills === "string" && user.skills.trim()) {
    user.skills.split(",").forEach((s) => {
      const trimmed = s.trim();
      if (trimmed && !profileSkills.includes(trimmed)) profileSkills.push(trimmed);
    });
  }

  const hasProfileSkills = profileSkills.length > 0;
  const availableSubSkills = hasProfileSkills ? ["All Profile Skills", ...profileSkills] : ["All Skills"];

  useEffect(() => {
    if (visible) {
      resetExamState();
    } else {
      clearInterval(timerRef.current);
    }
  }, [visible]);

  // 3-Second Start Countdown Effect
  useEffect(() => {
    if (startCountdown !== null) {
      if (typeof startCountdown === "number" && startCountdown > 1) {
        const timer = setTimeout(() => {
          setStartCountdown((prev) => (typeof prev === "number" ? prev - 1 : prev));
        }, 1000);
        return () => clearTimeout(timer);
      } else if (startCountdown === 1) {
        const timer = setTimeout(() => {
          setStartCountdown("GO!");
        }, 1000);
        return () => clearTimeout(timer);
      } else if (startCountdown === "GO!") {
        const timer = setTimeout(() => {
          setStartCountdown(null);
          setExamStarted(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [startCountdown]);

  // Countdown timer effect
  useEffect(() => {
    if (examStarted && !examFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [examStarted, examFinished]);

  const resetExamState = () => {
    setStartCountdown(null);
    setExamStarted(false);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setReviewedQuestions({});
    setShowHint(false);
    setTimeLeft(360);
    setExamFinished(false);
    setResultData(null);
    setSelectedSubSkill(hasProfileSkills ? "All Profile Skills" : "All Skills");
  };

  const handleStartExam = async (domainToUse = selectedDomain, subSkillToUse = selectedSubSkill) => {
    setIsGeneratingAiExam(true);
    try {
      let targetSkills = [];
      if (subSkillToUse && subSkillToUse !== "All Skills" && subSkillToUse !== "All Profile Skills") {
        targetSkills = [subSkillToUse];
      } else if (profileSkills.length > 0) {
        targetSkills = profileSkills;
      } else {
        targetSkills = [domainToUse];
      }

      // Generate 10 dynamic AI MCQs tailored specifically to this user's profile skills!
      let aiQuestions = await generateAiExamQuestionsForSkills(targetSkills, domainToUse);

      if (!aiQuestions || aiQuestions.length === 0) {
        const rawBank = QUESTION_BANKS[domainToUse] || QUESTION_BANKS["Coding & IT"];
        aiQuestions = rawBank;
      }

      const qList = aiQuestions.slice(0, 10).map((q) => {
        const originalCorrect = q.options ? q.options[q.correctIndex] || q.options[0] : "";
        const shuffledOpts = q.options ? shuffleArray(q.options) : ["Option A", "Option B", "Option C", "Option D"];
        const newCorrectIdx = Math.max(0, shuffledOpts.indexOf(originalCorrect));
        return {
          ...q,
          options: shuffledOpts,
          correctIndex: newCorrectIdx
        };
      });

      setQuestions(qList);
      setExamFinished(false);
      setTimeLeft(360);
      setStartCountdown(3);
    } catch (err) {
      console.warn("AI Question generation error:", err);
    } finally {
      setIsGeneratingAiExam(false);
    }
  };

  const handleSelectOption = (optIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optIndex
    }));
  };

  const toggleReviewMark = () => {
    setReviewedQuestions((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex]
    }));
  };

  const handleFinishExam = () => {
    clearInterval(timerRef.current);
    
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const totalQ = questions.length || 10;
    const pct = Math.round((correctCount / totalQ) * 100);
    let grade = "Passed";
    if (pct >= 90) grade = "Gold Specialist";
    else if (pct >= 75) grade = "Mastery Level";
    else if (pct >= 60) grade = "Proficient";

    const timeSpentSec = 360 - timeLeft;
    const certId = `TCM-ONE-EXAM-${Math.floor(10000 + Math.random() * 90000)}`;

    const examTitleStr = selectedSubSkill !== "All Skills" ? `${selectedSubSkill} (${selectedDomain})` : `${selectedDomain} Assessment`;

    const res = {
      certId,
      examTitle: examTitleStr,
      category: selectedDomain,
      subSkill: selectedSubSkill,
      score: correctCount * 10,
      totalQuestions: totalQ,
      correctAnswers: correctCount,
      percentage: pct,
      grade,
      timeTakenSeconds: timeSpentSec,
      createdAt: new Date().toISOString()
    };

    setResultData(res);
    setExamFinished(true);

    if (onSaveResult) {
      setSavingResult(true);
      onSaveResult(res).finally(() => setSavingResult(false));
    }
  };

  const handleCancelExam = () => {
    clearInterval(timerRef.current);
    resetExamState();
    if (onClose) onClose();
  };

  const confirmCancelExam = () => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Are you sure you want to cancel the exam? Your progress will be discarded.")) {
        handleCancelExam();
      }
    } else {
      Alert.alert(
        "Cancel Exam?",
        "Are you sure you want to cancel the exam? Your progress will be discarded and will NOT be added to your profile scoreboard.",
        [
          { text: "Continue Exam", style: "cancel" },
          { text: "Cancel & Discard", style: "destructive", onPress: handleCancelExam }
        ]
      );
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentQ = questions[currentIndex] || {};
  const answeredCount = Object.keys(selectedAnswers).length;
  const reviewCount = Object.values(reviewedQuestions).filter(Boolean).length;
  const unansweredCount = (questions.length || 10) - answeredCount;
  const progressPct = Math.round(((currentIndex + 1) / (questions.length || 10)) * 100);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {/* === SCENARIO 0: 3-SECOND COUNTDOWN OVERLAY === */}
        {startCountdown !== null && (
          <View style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            backgroundColor: theme.isDark ? "rgba(15, 23, 42, 0.96)" : "rgba(255, 255, 255, 0.96)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24
          }}>
            <View style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: theme.badgeBg,
              borderWidth: 4,
              borderColor: theme.primary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 10
            }}>
              <Text style={{ fontSize: startCountdown === "GO!" ? 36 : 64, fontFamily: fonts.bold, color: theme.primary }}>
                {startCountdown}
              </Text>
            </View>
            <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: theme.text, textAlign: "center", marginBottom: 6 }}>
              Get Ready!
            </Text>
            <Text style={{ fontSize: 13, fontFamily: fonts.medium, color: theme.subtext, textAlign: "center" }}>
              Exam starting in a moment... Focus and good luck!
            </Text>
          </View>
        )}

        {/* === SCENARIO 0: AI GENERATING EXAM QUESTIONS === */}
        {isGeneratingAiExam && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 30 }}>
            <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: theme.badgeBg, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
            <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: theme.text, textAlign: "center", marginBottom: 8 }}>
              Generating AI Skill Examination...
            </Text>
            <Text style={{ fontSize: 13, fontFamily: fonts.medium, color: theme.subtext, textAlign: "center", maxWidth: 300, lineHeight: 18 }}>
              Crafting 10 unique, real-time interview MCQs tailored specifically for your skills ({profileSkills.join(", ") || selectedDomain})...
            </Text>
          </View>
        )}

        {/* === SCENARIO 1: START SCREEN (WITH SPECIFIC SKILL SELECTION) === */}
        {!examStarted && !examFinished && startCountdown === null && !isGeneratingAiExam && (
          <ScrollView contentContainerStyle={{ padding: 20, alignItems: "center", paddingTop: 50 }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: theme.badgeBg, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <MaterialCommunityIcons name="brain" size={36} color={theme.primary} />
            </View>
            <Text style={{ fontSize: 22, fontFamily: fonts.bold, color: theme.text, textAlign: "center" }}>
              TCM One AI Interview & Skill Examinations
            </Text>
            <Text style={{ fontSize: 13, color: theme.subtext, textAlign: "center", marginTop: 4, marginBottom: 24, paddingHorizontal: 20 }}>
              Top-tier GeeksforGeeks & Toptal level interview questions with zero repetition tracking!
            </Text>

            {/* Select Exam Domain */}
            <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.subtext, alignSelf: "flex-start", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
              1. Select Target Domain:
            </Text>
            <View style={{ width: "100%", gap: 10, marginBottom: 20 }}>
              {["Coding & IT", "JEE & Engineering", "NEET & Medical", "Govt Exams & UPSC"].map((cat) => {
                const isSelected = selectedDomain === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      setSelectedDomain(cat);
                      setSelectedSubSkill("All Skills");
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justify: "space-between",
                      backgroundColor: isSelected ? theme.badgeBg : theme.cardBg,
                      borderColor: isSelected ? theme.primary : theme.border,
                      borderWidth: 1.5,
                      borderRadius: 16,
                      padding: 14
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <MaterialCommunityIcons
                        name={cat.includes("Medical") ? "dna" : cat.includes("JEE") ? "atom" : cat.includes("Govt") ? "landmark" : "code-tags"}
                        size={22}
                        color={isSelected ? theme.primary : theme.subtext}
                      />
                      <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: isSelected ? theme.primary : theme.text }}>
                        {cat}
                      </Text>
                    </View>
                    {isSelected && <Feather name="check-circle" size={18} color={theme.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Select Specific Skill Filter */}
            <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.subtext, alignSelf: "flex-start", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
              2. Target Specific Skill Specialty:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10, marginBottom: 24 }}>
              {availableSubSkills.map((sk) => {
                const isSel = selectedSubSkill === sk;
                return (
                  <TouchableOpacity
                    key={sk}
                    onPress={() => setSelectedSubSkill(sk)}
                    style={{
                      backgroundColor: isSel ? theme.primary : theme.cardBg,
                      borderColor: isSel ? theme.primary : theme.border,
                      borderWidth: 1,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <Text style={{ fontSize: 12.5, fontFamily: fonts.bold, color: isSel ? "#FFFFFF" : theme.text }}>
                      {sk}
                    </Text>
                    {isSel && <Feather name="check" size={14} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Exam Summary Rules */}
            <View style={{ width: "100%", backgroundColor: theme.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 26 }}>
              <Text style={{ fontSize: 13, fontFamily: fonts.bold, color: theme.text, marginBottom: 6 }}>Interview Exam Engine:</Text>
              <Text style={{ fontSize: 12, color: theme.subtext, lineHeight: 20 }}>
                • GeeksforGeeks & Toptal Standard Questions{"\n"}
                • Zero Repeat Engine (Tracks unseen questions in history){"\n"}
                • Target Skill: <Text style={{ color: theme.primary, fontFamily: fonts.bold }}>{selectedSubSkill}</Text> ({selectedDomain}){"\n"}
                • 10 MCQs • 6 Minutes Fast-Paced Test
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => handleStartExam(selectedDomain, selectedSubSkill)}
              style={{
                width: "100%",
                backgroundColor: theme.primary,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center"
              }}
            >
              <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: "#FFFFFF" }}>
                Start 10-Question {selectedSubSkill} Exam
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={{ marginTop: 14, padding: 10 }}>
              <Text style={{ fontSize: 13, fontFamily: fonts.semiBold, color: theme.subtext }}>Cancel & Exit</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* === SCENARIO 2: LIVE EXAM INTERFACE === */}
        {examStarted && !examFinished && (
          <View style={{ flex: 1, backgroundColor: theme.bg }}>
            
            {/* Top Navigation Bar */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: Platform.OS === "ios" ? 48 : 16, paddingBottom: 14, backgroundColor: theme.cardBg, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <TouchableOpacity onPress={confirmCancelExam}>
                <Feather name="arrow-left" size={22} color={theme.text} />
              </TouchableOpacity>
              
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: theme.text }}>
                  {selectedSubSkill !== "All Skills" ? selectedSubSkill : selectedDomain}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Text style={{ fontSize: 11, fontFamily: fonts.semiBold, color: theme.subtext }}>Interview Standard</Text>
                  <MaterialCommunityIcons name="chart-timeline-variant" size={12} color={theme.primary} />
                </View>
              </View>

              <TouchableOpacity
                onPress={confirmCancelExam}
                style={{ backgroundColor: theme.isDark ? "#7F1D1D30" : "#FEF2F2", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: "#FCA5A5" }}
              >
                <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: "#EF4444" }}>Cancel Exam</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
              
              {/* Top Stats Metric Card */}
              <View style={{ backgroundColor: theme.cardBg, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10.5, fontFamily: fonts.semiBold, color: theme.subtext, textTransform: "uppercase" }}>Question</Text>
                  <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: theme.primary, marginTop: 2 }}>
                    {currentIndex + 1} <Text style={{ fontSize: 13, color: theme.subtext }}>/ {questions.length}</Text>
                  </Text>
                </View>

                <View style={{ height: 32, width: 1, backgroundColor: theme.border }} />

                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 10.5, fontFamily: fonts.semiBold, color: theme.subtext, textTransform: "uppercase" }}>Time Left</Text>
                  <Text style={{ fontSize: 18, fontFamily: fonts.bold, color: timeLeft < 60 ? "#EF4444" : theme.primary, marginTop: 2 }}>
                    {formatTime(timeLeft)}
                  </Text>
                </View>

                <View style={{ height: 32, width: 1, backgroundColor: theme.border }} />

                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 10.5, fontFamily: fonts.semiBold, color: theme.subtext, textTransform: "uppercase" }}>Progress</Text>
                  <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: theme.primary, marginTop: 2 }}>
                    {progressPct}%
                  </Text>
                  <View style={{ height: 4, width: 60, backgroundColor: theme.border, borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${progressPct}%`, backgroundColor: theme.primary }} />
                  </View>
                </View>
              </View>

              {/* Question Text & Code Snippet Box */}
              <View style={{ backgroundColor: theme.cardBg, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: theme.border, marginBottom: 16 }}>
                <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: theme.text, lineHeight: 22, marginBottom: 14 }}>
                  {currentQ.question}
                </Text>

                {/* Dark Code / Scenario Snippet Container */}
                {currentQ.snippet && (
                  <View style={{ backgroundColor: theme.isDark ? "#0F172A" : "#1E1E2E", borderRadius: 14, padding: 14, marginBottom: 16 }}>
                    <Text style={{ fontSize: 12.5, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", color: "#F8F8F2", lineHeight: 20 }}>
                      {currentQ.snippet}
                    </Text>
                  </View>
                )}

                {/* Options A, B, C, D List */}
                <View style={{ gap: 10 }}>
                  {currentQ.options?.map((optText, optIdx) => {
                    const optionLetter = String.fromCharCode(65 + optIdx);
                    const isSelected = selectedAnswers[currentIndex] === optIdx;

                    return (
                      <TouchableOpacity
                        key={optIdx}
                        onPress={() => handleSelectOption(optIdx)}
                        activeOpacity={0.8}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: isSelected ? theme.badgeBg : theme.bg,
                          borderColor: isSelected ? theme.primary : theme.border,
                          borderWidth: isSelected ? 2 : 1,
                          borderRadius: 16,
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          minHeight: 54
                        }}
                      >
                        {/* Circle Badge (A, B, C, D) */}
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: isSelected ? theme.primary : theme.cardBg,
                            borderWidth: isSelected ? 0 : 1.5,
                            borderColor: isSelected ? theme.primary : theme.border,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 14
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: fonts.bold,
                              color: isSelected ? "#FFFFFF" : theme.text,
                              textAlign: "center",
                              lineHeight: 36,
                              marginTop: Platform.OS === "web" ? 2 : 1
                            }}
                          >
                            {optionLetter}
                          </Text>
                        </View>

                        {/* Option Text */}
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 14.5,
                            fontFamily: fonts.semiBold,
                            color: isSelected ? theme.primary : theme.text,
                            lineHeight: 20
                          }}
                        >
                          {optText}
                        </Text>

                        {/* Checkmark Badge */}
                        {isSelected && (
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center", marginLeft: 10 }}>
                            <Feather name="check" size={15} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* AI Hint Collapsible Card */}
                <View style={{ marginTop: 16, backgroundColor: theme.badgeBg, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: theme.border }}>
                  <TouchableOpacity
                    onPress={() => setShowHint(!showHint)}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <MaterialCommunityIcons name="robot" size={18} color={theme.primary} />
                      <Text style={{ fontSize: 12.5, fontFamily: fonts.bold, color: theme.primary }}>
                        AI Hint (Need help?)
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11.5, fontFamily: fonts.bold, color: theme.primary }}>
                      {showHint ? "Hide Hint" : "Show Hint"}
                    </Text>
                  </TouchableOpacity>

                  {showHint && (
                    <Text style={{ fontSize: 12, color: theme.text, marginTop: 8, lineHeight: 18 }}>
                      {currentQ.hint || "Review core principles for this question."}
                    </Text>
                  )}
                </View>
              </View>

              {/* Navigation Controls: Previous / Next */}
              {(() => {
                const isOptionSelected = selectedAnswers[currentIndex] !== undefined;
                return (
                  <View style={{ gap: 8, marginBottom: 16 }}>
                    {!isOptionSelected && (
                      <View style={{ backgroundColor: theme.badgeBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: "center", borderWidth: 1, borderColor: theme.border }}>
                        <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: theme.primary, textAlign: "center" }}>
                          Select an option (A, B, C, D) to proceed
                        </Text>
                      </View>
                    )}

                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setShowHint(false);
                          setCurrentIndex((prev) => Math.max(0, prev - 1));
                        }}
                        disabled={currentIndex === 0}
                        style={{
                          flex: 1,
                          backgroundColor: theme.cardBg,
                          borderColor: theme.primary,
                          borderWidth: 1.5,
                          borderRadius: 14,
                          paddingVertical: 14,
                          alignItems: "center",
                          opacity: currentIndex === 0 ? 0.4 : 1
                        }}
                      >
                        <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: theme.primary }}>
                          ‹ Previous
                        </Text>
                      </TouchableOpacity>

                      {currentIndex < questions.length - 1 ? (
                        <TouchableOpacity
                          onPress={() => {
                            if (!isOptionSelected) {
                              Alert.alert("Select an Option", "Please select an answer (A, B, C, D) before proceeding.");
                              return;
                            }
                            setShowHint(false);
                            setCurrentIndex((prev) => prev + 1);
                          }}
                          disabled={!isOptionSelected}
                          style={{
                            flex: 1,
                            backgroundColor: isOptionSelected ? theme.primary : theme.subtext,
                            borderRadius: 14,
                            paddingVertical: 14,
                            alignItems: "center",
                            opacity: isOptionSelected ? 1 : 0.5
                          }}
                        >
                          <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: "#FFFFFF" }}>
                            Next ›
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => {
                            if (!isOptionSelected) {
                              Alert.alert("Select an Option", "Please select an answer (A, B, C, D) before submitting.");
                              return;
                            }
                            handleFinishExam();
                          }}
                          disabled={!isOptionSelected}
                          style={{
                            flex: 1,
                            backgroundColor: isOptionSelected ? "#10B981" : theme.subtext,
                            borderRadius: 14,
                            paddingVertical: 14,
                            alignItems: "center",
                            opacity: isOptionSelected ? 1 : 0.5
                          }}
                        >
                          <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: "#FFFFFF" }}>
                            Submit Exam ✓
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })()}

              {/* Footer Question Status Tracker Pills */}
              <View style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: theme.border, flexDirection: "row", justifyContent: "space-around" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Feather name="check-square" size={14} color="#10B981" />
                  <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: "#10B981" }}>
                    Answered {answeredCount}
                  </Text>
                </View>
                
                <TouchableOpacity onPress={toggleReviewMark} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Feather name="bookmark" size={14} color={reviewedQuestions[currentIndex] ? "#F59E0B" : theme.subtext} />
                  <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: "#F59E0B" }}>
                    Review {reviewCount}
                  </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Feather name="minus-circle" size={14} color={theme.subtext} />
                  <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.subtext }}>
                    Unanswered {unansweredCount}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        )}

        {/* === SCENARIO 3: CLEAN POST-EXAM CERTIFICATE SCREEN === */}
        {examFinished && resultData && (
          <ScrollView contentContainerStyle={{ padding: 20, alignItems: "center", paddingTop: Platform.OS === "ios" ? 48 : 20, backgroundColor: theme.bg }}>
            
            {/* Top Close Bar */}
            <View style={{ width: "100%", flexDirection: "row", justifyContent: "flex-end", marginBottom: 10 }}>
              <TouchableOpacity
                onPress={onClose}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.cardBg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border }}
              >
                <Feather name="x" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Top Seal */}
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.badgeBg, alignItems: "center", justifyContent: "center", marginBottom: 12, borderWidth: 2, borderColor: theme.primary }}>
              <MaterialCommunityIcons name="shield-check-outline" size={40} color={theme.primary} />
            </View>

            <Text style={{ fontSize: 22, fontFamily: fonts.bold, color: theme.text, textAlign: "center" }}>
              Assessment Completed
            </Text>
            <Text style={{ fontSize: 12, color: theme.subtext, textAlign: "center", marginTop: 4, marginBottom: 20 }}>
              Official TCM Verified Student Achievement Record
            </Text>

            {/* HIGH QUALITY CERTIFICATE CARD */}
            <View
              style={{
                width: "100%",
                backgroundColor: theme.cardBg,
                borderRadius: 24,
                padding: 22,
                borderWidth: 2,
                borderColor: theme.primary,
                marginBottom: 24
              }}
            >
              {/* Header Bar */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 14, marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.badgeBg, alignItems: "center", justifyContent: "center" }}>
                    <Feather name="award" size={20} color={theme.primary} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: theme.text }}>{resultData.examTitle}</Text>
                    <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>
                      ID: {resultData.certId} • {new Date().toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View style={{ backgroundColor: theme.badgeBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: theme.border }}>
                  <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: theme.primary }}>{resultData.grade}</Text>
                </View>
              </View>

              {/* Student Avatar + Verified Header */}
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <View style={{ position: "relative", marginBottom: 10 }}>
                  {user?.avatarUrl ? (
                    <Image
                      source={{ uri: user.avatarUrl }}
                      style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: theme.primary }}
                    />
                  ) : (
                    <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: theme.border }}>
                      <Text style={{ fontSize: 24, fontFamily: fonts.bold, color: "#FFFFFF" }}>
                        {(user?.name || "S").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ position: "absolute", bottom: -2, right: -2, backgroundColor: "#10B981", width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: theme.cardBg }}>
                    <Feather name="check" size={12} color="#FFFFFF" />
                  </View>
                </View>

                <Text style={{ fontSize: 19, fontFamily: fonts.bold, color: theme.text }}>
                  {user?.name || "Student"}
                </Text>
                <Text style={{ fontSize: 11.5, color: theme.subtext, marginTop: 2 }}>
                  TCM One Verified Learner • {user?.handle ? `@${user.handle}` : "Achievement Credentials"}
                </Text>
              </View>

              {/* Score Dial */}
              <View style={{ alignItems: "center", backgroundColor: theme.bg, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: theme.border, marginBottom: 16 }}>
                <Text style={{ fontSize: 48, fontFamily: fonts.bold, color: theme.primary, letterSpacing: -1 }}>
                  {resultData.percentage}%
                </Text>
                <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.text, marginTop: 2 }}>
                  Accuracy Score ({resultData.correctAnswers} / {resultData.totalQuestions} Correct)
                </Text>
              </View>

              {/* Metric Breakdown Grid */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: theme.border }}>
                  <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: "#10B981" }}>{resultData.score} Pts</Text>
                  <Text style={{ fontSize: 10, color: theme.subtext, marginTop: 2 }}>Total Score</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: theme.border }}>
                  <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: theme.primary }}>{Math.round(resultData.timeTakenSeconds / 60)} Min</Text>
                  <Text style={{ fontSize: 10, color: theme.subtext, marginTop: 2 }}>Time Taken</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: theme.bg, borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: theme.border }}>
                  <Text style={{ fontSize: 15, fontFamily: fonts.bold, color: "#7C3AED" }}>Verified</Text>
                  <Text style={{ fontSize: 10, color: theme.subtext, marginTop: 2 }}>TCM AI Badge</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

      </View>
    </Modal>
  );
}
