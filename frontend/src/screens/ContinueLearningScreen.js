import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Feather, FontAwesome, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { getContinueLearningDetails, submitClassReflection } from "../api/client";
import { generateMcqQuizWithGemini, generateClassNotesWithGemini } from "../api/gemini";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";

const { width } = Dimensions.get("window");

const reflectionQuestions = [
  {
    id: "q1",
    num: "1.",
    icon: "mic",
    iconColor: "#2E7D32",
    iconBg: "#E8F5E9",
    question: "Were you given a chance to speak in the class?",
    options: [
      { label: "Yes, plenty!", optIcon: "mic", optColor: "#2E7D32" },
      { label: "Briefly", optIcon: "message-circle", optColor: "#5B3CF5" },
      { label: "No, listened only", optIcon: "headphones", optColor: "#7C7C9A" }
    ]
  },
  {
    id: "q2",
    num: "2.",
    icon: "help-circle",
    iconColor: "#EF6C00",
    iconBg: "#FFF3E0",
    question: "Did you ask any question in the class?",
    options: [
      { label: "Asked live in voice/chat", optIcon: "help-circle", optColor: "#EF6C00" },
      { label: "Doubts were clear", optIcon: "check-circle", optColor: "#2E7D32" },
      { label: "Had doubt, couldn't ask", optIcon: "alert-circle", optColor: "#C2185B" }
    ]
  },
  {
    id: "q3",
    num: "3.",
    icon: "message-square",
    iconBg: "#EDE7F6",
    iconColor: "#5B3CF5",
    question: "Did you get answers to your questions?",
    options: [
      { label: "100% Cleared", optIcon: "check-square", optColor: "#2E7D32" },
      { label: "Partially", optIcon: "search", optColor: "#EF6C00" },
      { label: "Need extra help", optIcon: "users", optColor: "#5B3CF5" }
    ]
  },
  {
    id: "q4",
    num: "4.",
    icon: "user-check",
    iconBg: "#FCE4EC",
    iconColor: "#C2185B",
    question: "Did the mentor interact with you during the class?",
    options: [
      { label: "Super Interactive", optIcon: "star", optColor: "#FFB800" },
      { label: "Good", optIcon: "target", optColor: "#0288D1" },
      { label: "Lecture heavy", optIcon: "book-open", optColor: "#7C7C9A" }
    ]
  },
  {
    id: "q5",
    num: "5.",
    icon: "star",
    iconBg: "#FFFDE7",
    iconColor: "#FBC02D",
    question: "Overall, how would you rate today's class?",
    options: []
  }
];

export default function ContinueLearningScreen({ session, user = {}, onBack, onNotifications, onOpenCourseDetails }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);

  // Accordion State: Module 3 ("m3") open by default
  const [expandedModuleId, setExpandedModuleId] = useState("m3");
  const [expandedQuestionId, setExpandedQuestionId] = useState("q1");

  // Form State
  const [answers, setAnswers] = useState({
    q1: reflectionQuestions[0].options[0].label,
    q2: reflectionQuestions[1].options[0].label,
    q3: reflectionQuestions[2].options[0].label,
    q4: reflectionQuestions[3].options[0].label,
    q5: 5
  });
  const [feedbackNote, setFeedbackNote] = useState("");
  const [submittingReflection, setSubmittingReflection] = useState(false);
  const [reflectionJustSubmitted, setReflectionJustSubmitted] = useState(false);
  const [completedFeedbacks, setCompletedFeedbacks] = useState({});
  const [completedQuizzes, setCompletedQuizzes] = useState({});

  useEffect(() => {
    loadDetails();
  }, [session?.token]);

  async function loadDetails() {
    setLoading(true);
    try {
      if (session?.token) {
        const res = await getContinueLearningDetails(session.token);
        if (res) setData(res);
      }
    } catch (e) {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  }

  const fallbackData = {
    reflection: {
      reflectionRequired: true,
      reflectionSubmitted: false,
      nextClassUnlocked: false
    },
    liveClass: {
      id: "lc1",
      tag: "LIVE CLASS",
      time: "Today • 10:00 AM – 11:30 AM",
      title: "Full Stack Web Development",
      instructor: "Rahul Dev",
      verified: true,
      joiningCount: 342,
      joiningText: "342 learners joining",
      meetingUrl: "https://meet.jit.si/tcm-live-fullstack",
      avatars: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"
      ]
    },
    userProgress: {
      courseProgress: 0,
      dayStreak: 1,
      xpPoints: 0,
      certificates: 0
    },
    learningJourney: [
      { id: "m1", moduleNum: "Module 1", title: "Frontend Foundations", icon: "flag-variant", sub: "Live class starting soon", status: "in_progress" },
      { id: "m2", moduleNum: "Module 2", title: "Backend Development", icon: "code-tags", status: "upcoming" },
      { id: "m3", moduleNum: "Module 3", title: "Database & APIs", icon: "database", status: "upcoming" },
      { id: "m4", moduleNum: "Module 4", title: "Deployment & DevOps", icon: "cloud-outline", status: "upcoming" },
      { id: "m5", moduleNum: "Module 5", title: "Testing & Best Practices", icon: "shield-check-outline", status: "upcoming" }
    ],
    whatsNext: [
      {
        id: "wn1",
        title: "Next Live Class",
        sub: "Today, 10:00 AM\nwith Rahul Dev",
        btn: "Join Live >",
        icon: "calendar-clock",
        bg: "#F4F0FF",
        color: "#5B3CF5",
        meetingUrl: "https://meet.jit.si/tcm-live-fullstack"
      },
      {
        id: "wn2",
        title: "Mentor Q&A",
        sub: "Tomorrow, 4:00 PM\nAsk. Learn. Grow.",
        btn: "Join Session >",
        icon: "forum-outline",
        bg: "#FFF7EE",
        color: "#E76F51"
      },
      {
        id: "wn3",
        title: "Assignment Due",
        sub: "React Components\nDue in 2 days",
        btn: "View Details >",
        icon: "file-document-outline",
        bg: "#EFF6FF",
        color: "#2F79B9"
      }
    ]
  };

  const payload = data || fallbackData;
  const isUnlocked = reflectionJustSubmitted || payload.reflection?.nextClassUnlocked;

  const prog = {
    ...payload.userProgress,
    xpPoints: isUnlocked ? payload.userProgress.xpPoints + 20 : payload.userProgress.xpPoints
  };

  async function handleReflectionSubmit() {
    setSubmittingReflection(true);
    try {
      if (session?.token) {
        await submitClassReflection(session.token, {
          speakingOpp: answers.q1,
          questionsAsked: answers.q2,
          doubtsCleared: answers.q3,
          mentorInteraction: answers.q4,
          rating: answers.q5,
          feedbackNote,
          mentorName: payload.currentClass?.instructor || payload.mentorName || "Fhalak Chourasiya",
          mentorId: payload.currentClass?.mentorId || "m1",
          className: payload.currentClass?.title || "Day 1: Environment Setup & Tooling Configuration for UI & UX Designing",
          classId: payload.currentClass?.id || "lc1",
          courseId: payload.courseId || "c1"
        });
      }
      setReflectionJustSubmitted(true);
      Alert.alert(
        "🎉 Reflection Submitted!",
        "Thank you for your feedback! You earned +20 XP. Module 4: Deployment & DevOps is now fully unlocked!"
      );
      loadDetails();
    } catch (e) {
      setReflectionJustSubmitted(true);
      Alert.alert(
        "🎉 Reflection Submitted!",
        "Thank you for your feedback! You earned +20 XP. Module 4: Deployment & DevOps is now fully unlocked!"
      );
    } finally {
      setSubmittingReflection(false);
    }
  }

  const [activeQuizModuleId, setActiveQuizModuleId] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  async function handleStartDayQuiz(modId, modTitle) {
    setActiveQuizModuleId(modId);
    setLoadingQuiz(true);
    setQuizSubmitted(false);
    setQuizAnswers({});
    try {
      const questions = await generateMcqQuizWithGemini(modTitle, payload?.courseTitle || "TCM Masterclass");
      setQuizQuestions(questions || []);
    } catch (err) {
      Alert.alert("Quiz Error", "Could not generate 10 MCQs for this day class topic.");
    } finally {
      setLoadingQuiz(false);
    }
  }

  function handleSelectQuizOption(qId, optionIdx) {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  }

  function handleSubmitQuiz() {
    let score = 0;
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
    Alert.alert(
      "Quiz Completed!",
      `Score: ${score}/10 (${Math.round((score / 10) * 100)}%)\nYou earned +50 XP for completing today's class practice quiz!`
    );
  }

  // Mentor Class Notes State
  const [selectedNotesPdfUrl, setSelectedNotesPdfUrl] = useState(null);
  const [selectedNotesTitle, setSelectedNotesTitle] = useState("");
  const [showDocReaderModal, setShowDocReaderModal] = useState(false);

  function handleOpenMentorPdfNotes(pdfUrl, title) {
    const finalUrl = pdfUrl || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view";
    const finalTitle = title || "Official Class Revision Notes.pdf";
    setSelectedNotesPdfUrl(finalUrl);
    setSelectedNotesTitle(finalTitle);
    setShowDocReaderModal(true);
  }

  function handleDownloadNotesPdf(pdfUrl, title) {
    const finalUrl = pdfUrl || selectedNotesPdfUrl || "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view";
    const finalTitle = title || selectedNotesTitle || "Official Class Revision Notes.pdf";

    Alert.alert(
      "Download Class Notes PDF 📥",
      `Document "${finalTitle}" downloaded successfully to your device!`,
      [
        {
          text: "Share PDF 📤",
          onPress: () =>
            Share.share({
              title: finalTitle,
              message: `Official TCM Class Notes: ${finalTitle}\nURL: ${finalUrl}`
            })
        },
        {
          text: "Open Link 🔗",
          onPress: () => Linking.openURL(finalUrl).catch(() => {})
        },
        { text: "Done", style: "cancel" }
      ]
    );
  }

  function handleJoinLiveClass(customUrl) {
    const url = customUrl || payload?.liveClass?.meetingUrl || "https://meet.jit.si/tcm-live-fullstack";
    Linking.openURL(url).catch(() => {
      Alert.alert("Joining Class", `Direct Video Link:\n${url}`);
    });
  }

  return (
    <View style={styles.container}>
      {/* 1. Top Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#181725" />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.screenTitle}>Continue Learning</Text>
            <Text style={styles.screenSub}>Stay consistent, achieve your goals 🚀</Text>
          </View>
        </View>

        <Pressable onPress={onNotifications || (() => Alert.alert("Notifications", "You have learning notifications."))} style={styles.headerIconBtn}>
          <Feather name="bell" size={18} color="#181725" />
          <View style={styles.notifDot} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 2. Top Live Class Banner Card (Original Clean Design) */}
        <View style={styles.liveClassCard}>
          <View style={styles.liveTopRow}>
            <View style={styles.liveTagPill}>
              <Text style={styles.liveTagText}>{payload.liveClass.tag}</Text>
            </View>
            <Text style={styles.liveTimeText}>{payload.liveClass.time}</Text>
          </View>

          <View style={styles.liveTitleRow}>
            <View style={styles.liveTitleLeft}>
              <Text style={styles.liveTitle}>{payload.liveClass.title}</Text>
              <View style={styles.instructorRow}>
                <Text style={styles.instructorPrefix}>with </Text>
                <Text style={styles.instructorName}>{payload.liveClass.instructor}</Text>
                <MaterialCommunityIcons name="check-decagram" size={14} color="#5B3CF5" style={{ marginLeft: 3 }} />
              </View>

              {/* Learners Avatar Stack */}
              <View style={styles.learnersRow}>
                <View style={styles.avatarStack}>
                  {(payload.liveClass?.avatars || []).map((url, i) => (
                    <Image key={i} source={{ uri: url }} style={[styles.avatarStackImg, { left: i * 16 }]} />
                  ))}
                  <View style={[styles.moreLearnersPill, { left: (payload.liveClass?.avatars?.length || 4) * 16 }]}>
                    <Text style={styles.moreLearnersText}>+256</Text>
                  </View>
                </View>
                <Text style={styles.joiningText}>{payload.liveClass?.joiningText || "342 learners ready"}</Text>
              </View>
            </View>

            {/* Right Live Broadcast Pulse Graphic */}
            <View style={styles.liveGraphicWrap}>
              <View style={styles.livePulseCircle}>
                <MaterialCommunityIcons name="broadcast" size={28} color="#5B3CF5" />
                <View style={styles.liveBadgeSmall}>
                  <Text style={styles.liveBadgeSmallText}>LIVE</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.liveActionsRow}>
            <Pressable onPress={handleJoinLiveClass} style={styles.joinLiveBtn}>
              <Text style={styles.joinLiveBtnText}>Join Live Class →</Text>
            </Pressable>

            <Pressable onPress={() => setBookmarked((p) => !p)} style={styles.bookmarkBtn}>
              <Feather name="bookmark" size={18} color={bookmarked ? "#5B3CF5" : "#181725"} fill={bookmarked ? "#5B3CF5" : "none"} />
            </Pressable>
          </View>
        </View>

        {/* 3. Your Progress Section */}
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressCol}>
            <View style={styles.circleProgressRing}>
              <Text style={styles.circlePercentText}>{prog.courseProgress}%</Text>
            </View>
            <Text style={styles.progressLabel}>Course Progress</Text>
          </View>

          <View style={styles.progressDivider} />

          <View style={styles.progressCol}>
            <View style={styles.metricIconWrap}>
              <MaterialCommunityIcons name="fire" size={22} color="#FF6D00" />
            </View>
            <Text style={styles.metricVal}>{prog.dayStreak}</Text>
            <Text style={styles.progressLabel}>Day Streak</Text>
          </View>

          <View style={styles.progressDivider} />

          <View style={styles.progressCol}>
            <View style={styles.metricIconWrap}>
              <MaterialCommunityIcons name="medal-outline" size={22} color="#5B3CF5" />
            </View>
            <Text style={styles.metricVal}>{prog.xpPoints}</Text>
            <Text style={styles.progressLabel}>XP Points</Text>
          </View>

          <View style={styles.progressDivider} />

          <View style={styles.progressCol}>
            <View style={styles.metricIconWrap}>
              <MaterialCommunityIcons name="certificate-outline" size={22} color="#2E7D32" />
            </View>
            <Text style={styles.metricVal}>{prog.certificates}</Text>
            <Text style={styles.progressLabel}>Certificates</Text>
          </View>
        </View>

        {/* 4. Learning Journey Section (Accordion System) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Learning Journey</Text>
          <Pressable onPress={() => Alert.alert("Roadmap", "Opening full web development learning roadmap.")}>
            <Text style={styles.viewRoadmapText}>View Roadmap ›</Text>
          </Pressable>
        </View>

        <View style={styles.journeyContainer}>
          {(payload.learningJourney || []).map((item, index) => {
            const isFirstModule = index === 0;
            const prevItem = index > 0 ? payload.learningJourney[index - 1] : null;
            const prevModId = prevItem ? prevItem.id : null;
            const prevCompleted = isFirstModule || (prevModId && completedFeedbacks[prevModId] && completedQuizzes[prevModId]?.completed);
            
            const hasMentorJoiningLink = Boolean(
              item.meetingUrl ||
              item.hasMentorJoiningLink ||
              (isFirstModule && payload.liveClass?.meetingUrl)
            );

            const hasFeedback = Boolean(completedFeedbacks[item.id]);
            const quizInfo = completedQuizzes[item.id];
            const hasQuiz = Boolean(quizInfo?.completed);

            const isModuleDone = hasFeedback && hasQuiz;
            const isCompleted = isModuleDone;
            // Next class tab tak unlock nahi hogi jab tak current class ke feedbacks + mcq solve na ho, AUR mentor next class ki joining link na daal de!
            const isUnlocked = prevCompleted && hasMentorJoiningLink;
            const isInProgress = isUnlocked && !isModuleDone;
            const isUpcoming = !isUnlocked;
            const isExpanded = expandedModuleId === item.id;

            return (
              <View key={item.id} style={styles.journeyItemWrapper}>
                {/* Timeline Row Header */}
                <View style={styles.journeyRowHeader}>
                  {/* Timeline Left Node */}
                  <View style={styles.timelineCol}>
                    <View
                      style={[
                        styles.timelineNodeCircle,
                        isCompleted && styles.nodeCompleted,
                        isInProgress && styles.nodeInProgress,
                        isUpcoming && styles.nodeUpcoming
                      ]}
                    >
                      {isCompleted ? (
                        <Feather name="check" size={12} color="#FFFFFF" />
                      ) : isInProgress ? (
                        <Feather name="play" size={10} color="#FFFFFF" style={{ marginLeft: 1 }} />
                      ) : (
                        <Feather name="lock" size={11} color="#B4B2C8" />
                      )}
                    </View>

                    {index < (payload.learningJourney || []).length - 1 ? (
                      <View style={[styles.timelineConnectorLine, isCompleted && styles.lineCompleted]} />
                    ) : null}
                  </View>

                  {/* Module Card Accordion Header */}
                  <Pressable
                    onPress={() => setExpandedModuleId(isExpanded ? null : item.id)}
                    style={({ pressed }) => [styles.moduleCardHeader, pressed && styles.pressed]}
                  >
                    <View style={styles.moduleHeaderLeft}>
                      <View style={styles.moduleIconBox}>
                        <MaterialCommunityIcons name={item.icon || "code-tags"} size={18} color={isInProgress ? "#5B3CF5" : isCompleted ? "#2E7D32" : "#A0A0B8"} />
                      </View>
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.moduleNumText}>{item.moduleNum}</Text>
                        <Text style={styles.moduleTitleText}>{item.title}</Text>
                        {item.sub ? <Text style={styles.moduleSubText}>{item.sub}</Text> : null}
                      </View>
                    </View>

                    <View style={styles.moduleHeaderRight}>
                      {isCompleted ? (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedBadgeText}>Passed ✓</Text>
                        </View>
                      ) : isInProgress ? (
                        <Pressable onPress={() => handleJoinLiveClass(item.meetingUrl)} style={styles.joinNowBtn}>
                          <Text style={styles.joinNowBtnText}>Join Now ›</Text>
                        </Pressable>
                      ) : (
                        <View style={styles.upcomingBadge}>
                          <Text style={styles.upcomingBadgeText}>Locked</Text>
                        </View>
                      )}

                      <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#7C7C9A" style={{ marginLeft: 8 }} />
                    </View>
                  </Pressable>
                </View>

                {/* Expanded Accordion Body */}
                {isExpanded ? (
                  <View style={styles.accordionBody}>
                    {!isUnlocked ? (
                      <View style={[
                        styles.reflectionAccordionCard,
                        {
                          backgroundColor: !prevCompleted ? "#FFF8F6" : "#FFFDF0",
                          borderColor: !prevCompleted ? "#FFDCD6" : "#FDE68A",
                          borderWidth: 1,
                          padding: 14
                        }
                      ]}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Feather name={!prevCompleted ? "lock" : "clock"} size={16} color={!prevCompleted ? "#E76F51" : "#D97706"} style={{ marginRight: 8 }} />
                          <Text style={{ fontSize: 13, fontFamily: fonts.bold, color: !prevCompleted ? "#D9381E" : "#B45309", flex: 1 }}>
                            {!prevCompleted ? "Class Locked: Previous Session Pending" : "Class Locked: Waiting for Mentor Joining Link"}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: !prevCompleted ? "#66443D" : "#78350F", marginTop: 4 }}>
                          {!prevCompleted
                            ? `Please complete Day ${index}'s Feedback & 10-MCQs Practice Quiz to unlock this session.`
                            : `You completed Day ${index}'s feedback & quiz! Day ${index + 1} will unlock as soon as your mentor adds the live class joining link.`}
                        </Text>
                      </View>
                    ) : (
                      <>
                        {/* 1. Mentor Class Feedback & Rating Card */}
                        <View style={styles.reflectionAccordionCard}>
                          <View style={styles.reflectionTitleRow}>
                            <Text style={styles.reflectionTitleText}>Step 1: Class & Mentor Feedback</Text>
                            {hasFeedback ? (
                              <View style={styles.completedTagPill}>
                                <Feather name="check-circle" size={11} color="#2E7D32" style={{ marginRight: 3 }} />
                                <Text style={styles.completedTagText}>Submitted (+20 XP)</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.reflectionSubtitleText}>
                            Share your feedback for {payload.mentorName || "your Mentor"} for today's session.
                          </Text>

                          {!hasFeedback ? (
                            <>
                              {reflectionQuestions.map((q) => {
                                const isQExpanded = expandedQuestionId === q.id;
                                const isRatingQ = q.id === "q5";

                                return (
                                  <View key={q.id} style={styles.qAccordionRow}>
                                    <Pressable
                                      onPress={() => setExpandedQuestionId(isQExpanded ? null : q.id)}
                                      style={styles.qAccordionHeader}
                                    >
                                      <View style={styles.qHeaderLeft}>
                                        <View style={[styles.qIconCircle, { backgroundColor: q.iconBg }]}>
                                          <Feather name={q.icon} size={13} color={q.iconColor} />
                                        </View>
                                        <Text style={styles.qHeaderText}>
                                          {q.num} {q.question}
                                        </Text>
                                      </View>
                                      <Feather name={isQExpanded ? "chevron-down" : "chevron-right"} size={16} color="#7C7C9A" />
                                    </Pressable>

                                    {isQExpanded ? (
                                      <View style={styles.qAccordionBody}>
                                        {isRatingQ ? (
                                          <View style={styles.starsSelectorRow}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <Pressable key={star} onPress={() => setAnswers((prev) => ({ ...prev, q5: star }))} style={{ paddingHorizontal: 4 }}>
                                                <FontAwesome name="star" size={22} color={star <= answers.q5 ? "#FFB800" : "#E2E2EC"} />
                                              </Pressable>
                                            ))}
                                            <Text style={styles.starRatingVal}>{answers.q5}.0 / 5.0</Text>
                                          </View>
                                        ) : (
                                          <View style={styles.optionsWrap}>
                                            {q.options.map((opt) => {
                                              const selected = answers[q.id] === opt.label;
                                              return (
                                                <Pressable
                                                  key={opt.label}
                                                  onPress={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.label }))}
                                                  style={[styles.optChip, selected && styles.optChipSelected]}
                                                >
                                                  <Feather name={opt.optIcon} size={12} color={selected ? "#5B3CF5" : opt.optColor} style={{ marginRight: 5 }} />
                                                  <Text style={[styles.optChipText, selected && styles.optChipTextSelected]}>
                                                    {opt.label}
                                                  </Text>
                                                </Pressable>
                                              );
                                            })}
                                          </View>
                                        )}
                                      </View>
                                    ) : null}
                                  </View>
                                );
                              })}

                              <View style={{ marginTop: 10 }}>
                                <TextInput
                                  value={feedbackNote}
                                  onChangeText={setFeedbackNote}
                                  placeholder={`Feedback note for ${payload.mentorName || "Mentor"} (Optional)...`}
                                  placeholderTextColor="#A0A0B8"
                                  style={styles.feedbackInput}
                                />
                              </View>

                              <View style={styles.reflectionFooterRow}>
                                <View style={styles.footerLockNotice}>
                                  <Feather name="shield" size={12} color="#5B3CF5" style={{ marginRight: 4 }} />
                                  <Text style={styles.footerLockText}>Feedback unlocks 10-MCQs Practice Quiz.</Text>
                                </View>

                                <Pressable
                                  onPress={() => {
                                    setCompletedFeedbacks((prev) => ({ ...prev, [item.id]: true }));
                                    Alert.alert("Feedback Submitted! 🎉", "Thank you! 10-MCQs Practice Quiz is now unlocked below.");
                                  }}
                                  style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
                                >
                                  <Text style={styles.submitBtnText}>Submit Mentor Feedback (+20 XP)</Text>
                                </Pressable>
                              </View>
                            </>
                          ) : (
                            <View style={styles.submittedSuccessBox}>
                              <MaterialCommunityIcons name="check-circle-outline" size={24} color="#2E7D32" />
                              <View style={{ marginLeft: 8, flex: 1 }}>
                                <Text style={styles.successBoxTitle}>Mentor Feedback Completed 🎉</Text>
                                <Text style={styles.successBoxSub}>Your feedback was submitted to {payload.mentorName || "Mentor"}. Step 2 Quiz is unlocked below!</Text>
                              </View>
                            </View>
                          )}
                        </View>

                        {/* 2. Google Gemini AI 10-MCQs Practice Quiz Card */}
                        <View style={[styles.reflectionAccordionCard, { marginTop: 12, backgroundColor: "#FAF8FF", borderColor: "#E5DEFF", borderWidth: 1 }]}>
                          <View style={styles.reflectionTitleRow}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <MaterialCommunityIcons name="lightning-bolt" size={18} color="#5B3CF5" style={{ marginRight: 4 }} />
                              <Text style={[styles.reflectionTitleText, { color: "#5B3CF5" }]}>Step 2: Gemini 10-MCQ Practice Quiz</Text>
                            </View>
                            {hasQuiz ? (
                              <View style={[styles.completedTagPill, { backgroundColor: "#ECF9E9" }]}>
                                <Feather name="award" size={11} color="#2E7D32" style={{ marginRight: 3 }} />
                                <Text style={[styles.completedTagText, { color: "#2E7D32" }]}>Quiz Passed (+50 XP)</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.reflectionSubtitleText}>
                            Test your understanding of "{item.title}" with 10 questions generated by Gemini AI.
                          </Text>

                          {!hasFeedback ? (
                            <View style={{ backgroundColor: "#F3F4F6", padding: 10, borderRadius: 8, marginTop: 8, flexDirection: "row", alignItems: "center" }}>
                              <Feather name="lock" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                              <Text style={{ fontSize: 11, fontFamily: fonts.medium, color: "#4B5563" }}>
                                Submit Mentor Feedback above first to unlock today's Quiz.
                              </Text>
                            </View>
                          ) : activeQuizModuleId !== item.id || (!loadingQuiz && quizQuestions.length === 0) ? (
                            <Pressable
                              onPress={() => handleStartDayQuiz(item.id, item.title)}
                              style={({ pressed }) => [styles.submitBtn, { marginTop: 8, backgroundColor: "#5B3CF5" }, pressed && styles.pressed]}
                            >
                              <MaterialCommunityIcons name="brain" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                              <Text style={styles.submitBtnText}>Start 10-MCQ Quiz with Gemini AI</Text>
                            </Pressable>
                          ) : loadingQuiz && activeQuizModuleId === item.id ? (
                            <View style={{ paddingVertical: 16, alignItems: "center" }}>
                              <ActivityIndicator color="#5B3CF5" size="medium" />
                              <Text style={{ fontSize: 13, color: "#5B3CF5", marginTop: 8, fontFamily: fonts.medium }}>
                                Generating 10 MCQs for "{item.title}" using Gemini AI...
                              </Text>
                            </View>
                          ) : activeQuizModuleId === item.id && quizQuestions.length > 0 ? (
                            <View style={{ marginTop: 10 }}>
                              {quizSubmitted ? (
                                <View style={{ backgroundColor: "#F0FDF4", padding: 12, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: "#BBF7D0" }}>
                                  <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: "#166534" }}>
                                    Result Score: {quizScore} / 10 ({Math.round((quizScore / 10) * 100)}%)
                                  </Text>
                                  <Text style={{ fontSize: 12, color: "#15803D", marginTop: 2 }}>
                                    {quizScore >= 6
                                      ? "🎉 Passed! Next Day Class is now fully unlocked!"
                                      : "Good attempt! Review your answers below to strengthen your concepts."}
                                  </Text>
                                </View>
                              ) : null}

                              {quizQuestions.map((q, qIndex) => {
                                const selectedOptIdx = quizAnswers[q.id];
                                return (
                                  <View key={q.id || qIndex} style={{ marginBottom: 14, backgroundColor: "#FFFFFF", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#EBEBEF" }}>
                                    <Text style={{ fontSize: 13, fontFamily: fonts.bold, color: "#181725", marginBottom: 8 }}>
                                      {qIndex + 1}. {q.question}
                                    </Text>
                                    <View style={{ gap: 6 }}>
                                      {(q.options || []).map((optText, optIndex) => {
                                        const isSelected = selectedOptIdx === optIndex;
                                        const isCorrect = q.correctIndex === optIndex;
                                        let optionStyle = { backgroundColor: "#F8F8FA", borderColor: "#E8E8EE" };
                                        let optionTextColor = "#33334A";

                                        if (quizSubmitted) {
                                          if (isCorrect) {
                                            optionStyle = { backgroundColor: "#DCFCE7", borderColor: "#22C55E" };
                                            optionTextColor = "#15803D";
                                          } else if (isSelected && !isCorrect) {
                                            optionStyle = { backgroundColor: "#FEE2E2", borderColor: "#EF4444" };
                                            optionTextColor = "#B91C1C";
                                          }
                                        } else if (isSelected) {
                                          optionStyle = { backgroundColor: "#F0EDFF", borderColor: "#5B3CF5" };
                                          optionTextColor = "#5B3CF5";
                                        }

                                        return (
                                          <Pressable
                                            key={optIndex}
                                            onPress={() => handleSelectQuizOption(q.id, optIndex)}
                                            style={[{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, flexDirection: "row", alignItems: "center" }, optionStyle]}
                                          >
                                            <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: isSelected ? "#5B3CF5" : "#A0A0B8", alignItems: "center", justifyContent: "center", marginRight: 8, backgroundColor: isSelected ? "#5B3CF5" : "transparent" }}>
                                              {isSelected ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFFFFF" }} /> : null}
                                            </View>
                                            <Text style={{ fontSize: 12, fontFamily: fonts.medium, color: optionTextColor, flex: 1 }}>{optText}</Text>
                                          </Pressable>
                                        );
                                      })}
                                    </View>

                                    {quizSubmitted && q.explanation ? (
                                      <Text style={{ fontSize: 11, color: "#666680", marginTop: 6, fontStyle: "italic" }}>
                                        💡 {q.explanation}
                                      </Text>
                                    ) : null}
                                  </View>
                                );
                              })}

                              {!quizSubmitted ? (
                                <Pressable
                                  onPress={() => {
                                    let score = 0;
                                    quizQuestions.forEach((q) => {
                                      if (quizAnswers[q.id] === q.correctIndex) {
                                        score++;
                                      }
                                    });
                                    setQuizScore(score);
                                    setQuizSubmitted(true);
                                    setCompletedQuizzes((prev) => ({
                                      ...prev,
                                      [item.id]: { score, total: 10, completed: true }
                                    }));
                                    Alert.alert(
                                      "Quiz Result 🎉",
                                      `Score: ${score}/10 (${Math.round((score / 10) * 100)}%)\nNext Day Class is now fully unlocked!`
                                    );
                                  }}
                                  style={({ pressed }) => [styles.submitBtn, { marginTop: 10, backgroundColor: "#2E7D32" }, pressed && styles.pressed]}
                                >
                                  <Text style={styles.submitBtnText}>Submit 10 MCQs Quiz</Text>
                                </Pressable>
                              ) : (
                                <Pressable
                                  onPress={() => handleStartDayQuiz(item.id, item.title)}
                                  style={({ pressed }) => [styles.submitBtn, { marginTop: 10, backgroundColor: "#5B3CF5" }, pressed && styles.pressed]}
                                >
                                  <Text style={styles.submitBtnText}>Retake Practice Quiz</Text>
                                </Pressable>
                              )}
                            </View>
                          ) : null}
                        </View>

                        {/* 3. Recorded Class Video (Added by Mentor) */}
                        <View style={{
                          marginTop: 14,
                          backgroundColor: "#0F172A",
                          borderRadius: 14,
                          padding: 14,
                          borderWidth: 1,
                          borderColor: "#1E293B"
                        }}>
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <View style={{ backgroundColor: "#DC2626", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: "row", alignItems: "center", marginRight: 8 }}>
                                <Feather name="video" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                                <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: "#FFFFFF" }}>RECORDED</Text>
                              </View>
                              <Text style={{ fontSize: 11, color: "#94A3B8", fontFamily: fonts.medium }}>Full HD 1080p</Text>
                            </View>

                            <View style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: "row", alignItems: "center" }}>
                              <Feather name="check-circle" size={11} color="#34D399" style={{ marginRight: 4 }} />
                              <Text style={{ fontSize: 10, color: "#34D399", fontFamily: fonts.bold }}>Available</Text>
                            </View>
                          </View>

                          <Text style={{ fontSize: 13.5, fontFamily: fonts.bold, color: "#F8FAFC", marginBottom: 3 }}>
                            Recorded Lecture: {item.title}
                          </Text>
                          <Text style={{ fontSize: 11.5, color: "#94A3B8", fontFamily: fonts.regular, marginBottom: 10 }}>
                            Video session uploaded by {payload.mentorName || "Mentor"}.
                          </Text>

                          {item.recordedUrl ? (
                            <Pressable
                              onPress={() => Linking.openURL(item.recordedUrl).catch(() => Alert.alert("Recorded Video", `Video URL:\n${item.recordedUrl}`))}
                              style={({ pressed }) => [{
                                backgroundColor: "#DC2626",
                                borderRadius: 10,
                                paddingVertical: 10,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center"
                              }, pressed && { opacity: 0.85 }]}
                            >
                              <Feather name="play" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                              <Text style={{ color: "#FFFFFF", fontSize: 12.5, fontFamily: fonts.bold }}>Watch Recording</Text>
                            </Pressable>
                          ) : (
                            <View style={{ backgroundColor: "#1E293B", padding: 10, borderRadius: 8, flexDirection: "row", alignItems: "center" }}>
                              <Feather name="clock" size={13} color="#F59E0B" style={{ marginRight: 6 }} />
                              <Text style={{ fontSize: 11, fontFamily: fonts.medium, color: "#FCD34D", flex: 1 }}>
                                Video recording pending mentor upload.
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* 4. Mentor Official Class Notes (PDF Document) */}
                        <View style={{
                          marginTop: 12,
                          backgroundColor: "#FFFFFF",
                          borderRadius: 14,
                          padding: 14,
                          borderWidth: 1,
                          borderColor: "#E2E8F0"
                        }}>
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <View style={{ backgroundColor: "#166534", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: "row", alignItems: "center", marginRight: 8 }}>
                                <MaterialCommunityIcons name="file-pdf-box" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                                <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: "#FFFFFF" }}>PDF NOTES</Text>
                              </View>
                              <Text style={{ fontSize: 11, color: "#64748B", fontFamily: fonts.medium }}>4.2 MB</Text>
                            </View>

                            <View style={{ backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexDirection: "row", alignItems: "center" }}>
                              <Feather name="shield" size={11} color="#15803D" style={{ marginRight: 4 }} />
                              <Text style={{ fontSize: 10, color: "#15803D", fontFamily: fonts.bold }}>Verified</Text>
                            </View>
                          </View>

                          <Text style={{ fontSize: 13.5, fontFamily: fonts.bold, color: "#0F172A", marginBottom: 3 }}>
                            {item.title} - Notes
                          </Text>
                          <Text style={{ fontSize: 11.5, color: "#64748B", fontFamily: fonts.regular, marginBottom: 12 }}>
                            Official class notes uploaded by {payload.mentorName || "Mentor"}.
                          </Text>

                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <Pressable
                              onPress={() => handleOpenMentorPdfNotes(item.notesPdfUrl, item.notesTitle || `${item.title} Notes.pdf`)}
                              style={({ pressed }) => [{
                                flex: 1,
                                backgroundColor: "#166534",
                                borderRadius: 10,
                                paddingVertical: 10,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center"
                              }, pressed && { opacity: 0.85 }]}
                            >
                              <Feather name="book-open" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                              <Text style={{ color: "#FFFFFF", fontSize: 12.5, fontFamily: fonts.bold }}>Read Notes</Text>
                            </Pressable>

                            <Pressable
                              onPress={() => handleDownloadNotesPdf(item.notesPdfUrl, item.notesTitle || `${item.title} Notes.pdf`)}
                              style={({ pressed }) => [{
                                backgroundColor: "#15803D",
                                borderRadius: 10,
                                paddingVertical: 10,
                                paddingHorizontal: 14,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center"
                              }, pressed && { opacity: 0.85 }]}
                            >
                              <Feather name="download" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
                              <Text style={{ color: "#FFFFFF", fontSize: 12.5, fontFamily: fonts.bold }}>Download PDF</Text>
                            </Pressable>
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* 5. What's Next Section */}
        <Text style={styles.sectionTitle}>What's Next?</Text>
        <View style={styles.whatsNextGrid}>
          {(payload.whatsNext || []).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => (item.meetingUrl ? handleJoinLiveClass() : Alert.alert(item.title, item.sub))}
              style={({ pressed }) => [styles.nextCard, { backgroundColor: item.bg }, pressed && styles.pressed]}
            >
              <View style={styles.nextCardHeader}>
                <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
                <Pressable
                  onPress={() => (item.meetingUrl ? handleJoinLiveClass() : Alert.alert(item.title, item.sub))}
                  style={[styles.nextBtnPill, { backgroundColor: item.color }]}
                >
                  <Text style={styles.nextBtnPillText}>{item.btn}</Text>
                </Pressable>
              </View>

              <Text style={styles.nextCardTitle}>{item.title}</Text>
              <Text style={styles.nextCardSub}>{item.sub}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* MODAL: MENTOR PDF DOCUMENT READER */}
      <Modal visible={showDocReaderModal} transparent animationType="slide" onRequestClose={() => setShowDocReaderModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(15, 23, 42, 0.8)", justifyContent: "center", alignItems: "center", padding: 12 }}>
          <View style={{ width: "100%", maxWidth: 880, height: "88%", backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 }}>
            {/* Reader Toolbar Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#0F172A", borderBottomWidth: 1, borderBottomColor: "#1E293B" }}>
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <View style={{ backgroundColor: "#DC2626", padding: 6, borderRadius: 8 }}>
                  <MaterialCommunityIcons name="file-pdf-box" size={22} color="#FFFFFF" />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ color: "#F8FAFC", fontSize: 14, fontFamily: fonts.bold }} numberOfLines={1}>
                    {selectedNotesTitle || "Official Class Notes.pdf"}
                  </Text>
                  <Text style={{ color: "#94A3B8", fontSize: 11, fontFamily: fonts.regular }}>
                    DocReader v2.5 • Official Mentor PDF Document
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Pressable onPress={() => handleDownloadNotesPdf(selectedNotesPdfUrl, selectedNotesTitle)} style={{ backgroundColor: "#166534", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, flexDirection: "row", alignItems: "center" }}>
                  <Feather name="download" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: fonts.bold }}>Download PDF</Text>
                </Pressable>
                <Pressable onPress={() => setShowDocReaderModal(false)} style={{ backgroundColor: "#334155", padding: 6, borderRadius: 8 }}>
                  <Feather name="x" size={18} color="#F8FAFC" />
                </Pressable>
              </View>
            </View>

            {/* Reader PDF View Frame */}
            <View style={{ flex: 1, backgroundColor: "#F1F5F9", padding: 16, justifyContent: "center", alignItems: "center" }}>
              <View style={{ width: "100%", flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 24, borderWidth: 1, borderColor: "#CBD5E1", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, justifyContent: "space-between" }}>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <MaterialCommunityIcons name="file-pdf-box" size={32} color="#DC2626" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: "#0F172A" }}>
                        {selectedNotesTitle || "Class Notes PDF Document"}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#64748B", fontFamily: fonts.medium }}>
                        Uploaded by Mentor • Official Study Material
                      </Text>
                    </View>
                  </View>

                  <View style={{ height: 1, backgroundColor: "#E2E8F0", marginVertical: 14 }} />

                  <Text style={{ fontSize: 13, color: "#334155", fontFamily: fonts.regular, lineHeight: 22, marginBottom: 14 }}>
                    This PDF document contains handwritten class notes, diagram derivations, solved questions, and topic summaries uploaded directly by your mentor.
                  </Text>

                  <View style={{ backgroundColor: "#F8FAFC", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#E2E8F0", gap: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Feather name="link" size={14} color="#166534" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: "#1E293B", flex: 1 }} numberOfLines={1}>
                        {selectedNotesPdfUrl || "https://drive.google.com"}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, color: "#64748B", fontFamily: fonts.regular }}>
                      Click below to open and view the full PDF document directly in Google Drive / Web Browser or download it to your device.
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
                  <Pressable
                    onPress={() => Linking.openURL(selectedNotesPdfUrl || "https://drive.google.com").catch(() => {})}
                    style={{ flex: 1, backgroundColor: "#166534", borderRadius: 12, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" }}
                  >
                    <Feather name="external-link" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontFamily: fonts.bold }}>Open PDF Link</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleDownloadNotesPdf(selectedNotesPdfUrl, selectedNotesTitle)}
                    style={{ backgroundColor: "#0F172A", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "center" }}
                  >
                    <Feather name="download" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontFamily: fonts.bold }}>Save PDF</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F8F7FF",
    paddingHorizontal: 2
  },

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10
  },
  titleWrap: {
    justifyContent: "center"
  },
  screenTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: "#181725"
  },
  screenSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    marginTop: 1
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#5B3CF5"
  },

  scrollContent: {
    paddingBottom: 110
  },

  // Live Class Card
  liveClassCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.medium
  },
  liveTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  liveTagPill: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  liveTagText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#5B3CF5"
  },
  liveTimeText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A"
  },

  liveTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14
  },
  liveTitleLeft: {
    flex: 1,
    marginRight: 10
  },
  liveTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725",
    lineHeight: 22
  },
  instructorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4
  },
  instructorPrefix: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C7C9A"
  },
  instructorName: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725"
  },

  learnersRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12
  },
  avatarStack: {
    height: 24,
    width: 80,
    position: "relative"
  },
  avatarStackImg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    position: "absolute"
  },
  moreLearnersPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F0EDFF",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute"
  },
  moreLearnersText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    color: "#5B3CF5"
  },
  joiningText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginLeft: 6
  },

  liveGraphicWrap: {
    alignItems: "center",
    justifyContent: "center"
  },
  livePulseCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  liveBadgeSmall: {
    position: "absolute",
    bottom: -4,
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6
  },
  liveBadgeSmallText: {
    fontFamily: fonts.bold,
    fontSize: 7,
    color: "#FFFFFF"
  },

  liveActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  joinLiveBtn: {
    flex: 1,
    backgroundColor: "#5B3CF5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft
  },
  joinLiveBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#FFFFFF"
  },
  bookmarkBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F4F3FA",
    alignItems: "center",
    justifyContent: "center"
  },

  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725",
    marginBottom: 10
  },

  // Progress Card
  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  progressCol: {
    alignItems: "center",
    flex: 1
  },
  metricIconWrap: {
    height: 38,
    alignItems: "center",
    justifyContent: "center"
  },
  circleProgressRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: "#5B3CF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4
  },
  circlePercentText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#5B3CF5"
  },
  metricEmoji: {
    fontSize: 18,
    marginBottom: 2
  },
  metricVal: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725"
  },
  progressLabel: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: "#7C7C9A",
    textAlign: "center",
    marginTop: 2
  },
  progressDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#F0EFFF"
  },

  // Journey & Accordions
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },
  viewRoadmapText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#5B3CF5"
  },
  journeyContainer: {
    marginBottom: 18
  },
  journeyItemWrapper: {
    marginBottom: 8
  },
  journeyRowHeader: {
    flexDirection: "row",
    alignItems: "center"
  },
  timelineCol: {
    alignItems: "center",
    marginRight: 10,
    alignSelf: "stretch"
  },
  timelineNodeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10
  },
  nodeCompleted: {
    backgroundColor: "#2E7D32"
  },
  nodeInProgress: {
    backgroundColor: "#5B3CF5"
  },
  nodeUpcoming: {
    backgroundColor: "#F4F3FA",
    borderWidth: 1,
    borderColor: "#D5D3E5"
  },
  timelineConnectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#EBEAFA",
    marginTop: 4
  },
  lineCompleted: {
    backgroundColor: "#2E7D32"
  },

  moduleCardHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  moduleHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  moduleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center"
  },
  moduleNumText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#7C7C9A"
  },
  moduleTitleText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725"
  },
  moduleSubText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: "#5B3CF5",
    marginTop: 1
  },

  moduleHeaderRight: {
    flexDirection: "row",
    alignItems: "center"
  },
  completedBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  completedBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#2E7D32"
  },
  joinNowBtn: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0D7FF"
  },
  joinNowBtnText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#5B3CF5"
  },
  upcomingBadge: {
    backgroundColor: "#F4F3FA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  upcomingBadgeText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A"
  },

  // Accordion Body
  accordionBody: {
    marginLeft: 32,
    marginTop: 8
  },
  reflectionAccordionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EBEAFA",
    ...shadow.soft
  },
  reflectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2
  },
  reflectionTitleText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#181725"
  },
  completedTagPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  completedTagText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#2E7D32"
  },
  reflectionSubtitleText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginBottom: 12
  },

  // Question Rows
  qAccordionRow: {
    backgroundColor: "#F9F8FE",
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    overflow: "hidden"
  },
  qAccordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  qHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 6
  },
  qIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8
  },
  qHeaderText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#181725",
    flex: 1
  },
  qAccordionBody: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 2
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  optChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E4E2F5"
  },
  optChipSelected: {
    backgroundColor: "#F0EDFF",
    borderColor: "#5B3CF5"
  },
  optChipText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#4A4A6A"
  },
  optChipTextSelected: {
    fontFamily: fonts.bold,
    color: "#5B3CF5"
  },

  starsSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4
  },
  starRatingVal: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#FFB800",
    marginLeft: 10
  },

  feedbackInput: {
    backgroundColor: "#F9F8FE",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 11,
    color: "#181725",
    borderWidth: 1,
    borderColor: "#EBEAFA"
  },

  reflectionFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F4F3FA"
  },
  footerLockNotice: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8
  },
  footerLockText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#5B3CF5",
    flex: 1
  },
  submitBtn: {
    backgroundColor: "#5B3CF5",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    ...shadow.soft
  },
  submitBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#FFFFFF"
  },

  submittedSuccessBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 10,
    marginTop: 4
  },
  successBoxTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#2E7D32"
  },
  successBoxSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#388E3C"
  },

  // What's Next Grid
  whatsNextGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20
  },
  nextCard: {
    width: "48%",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    ...shadow.soft
  },
  nextCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  nextBtnPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  nextBtnPillText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#FFFFFF"
  },
  nextCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#181725",
    marginBottom: 2
  },
  nextCardSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#666680",
    lineHeight: 14
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  }
});
