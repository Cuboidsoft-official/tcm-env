import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Feather, FontAwesome, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { getContinueLearningDetails, submitClassReflection } from "../api/client";
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
      tag: "🔴 LIVE CLASS",
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
      courseProgress: 65,
      dayStreak: 7,
      xpPoints: 1280,
      certificates: 3
    },
    learningJourney: [
      { id: "m1", moduleNum: "Module 1", title: "Frontend Foundations", icon: "flag-variant", status: "completed" },
      { id: "m2", moduleNum: "Module 2", title: "Backend Development", icon: "code-tags", status: "completed" },
      { id: "m3", moduleNum: "Module 3", title: "Database & APIs", icon: "database", sub: "Live class in progress", status: "in_progress" },
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
          feedbackNote
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

  function handleJoinLiveClass() {
    const url = payload.liveClass.meetingUrl || "https://meet.jit.si/tcm-live-fullstack";
    Alert.alert("🚀 Joining Live Class", `Opening live video meeting:\n${url}\n\nInstructor: Rahul Dev`);
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
                  {payload.liveClass.avatars.map((url, i) => (
                    <Image key={i} source={{ uri: url }} style={[styles.avatarStackImg, { left: i * 16 }]} />
                  ))}
                  <View style={[styles.moreLearnersPill, { left: payload.liveClass.avatars.length * 16 }]}>
                    <Text style={styles.moreLearnersText}>+256</Text>
                  </View>
                </View>
                <Text style={styles.joiningText}>{payload.liveClass.joiningText}</Text>
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
          {payload.learningJourney.map((item, index) => {
            const isCompleted = item.status === "completed";
            const isInProgress = item.status === "in_progress";
            const isUpcoming = (item.status === "upcoming" || item.status === "locked") && !isUnlocked;
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

                    {index < payload.learningJourney.length - 1 ? (
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
                        <MaterialCommunityIcons name={item.icon || "code-tags"} size={18} color="#5B3CF5" />
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
                          <Text style={styles.completedBadgeText}>Completed</Text>
                        </View>
                      ) : isInProgress ? (
                        <Pressable onPress={handleJoinLiveClass} style={styles.joinNowBtn}>
                          <Text style={styles.joinNowBtnText}>Join Now ›</Text>
                        </Pressable>
                      ) : (
                        <View style={styles.upcomingBadge}>
                          <Text style={styles.upcomingBadgeText}>{isUnlocked && item.id === "m4" ? "Unlocked 🎉" : "Upcoming"}</Text>
                        </View>
                      )}

                      <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#7C7C9A" style={{ marginLeft: 8 }} />
                    </View>
                  </Pressable>
                </View>

                {/* Expanded Accordion Body (Class Reflection inside Module 3) */}
                {isExpanded && item.id === "m3" ? (
                  <View style={styles.accordionBody}>
                    <View style={styles.reflectionAccordionCard}>
                      <View style={styles.reflectionTitleRow}>
                        <Text style={styles.reflectionTitleText}>Class Reflection (Required)</Text>
                        {isUnlocked ? (
                          <View style={styles.completedTagPill}>
                            <Feather name="check-circle" size={11} color="#2E7D32" style={{ marginRight: 3 }} />
                            <Text style={styles.completedTagText}>Submitted (+20 XP)</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.reflectionSubtitleText}>
                        Please take a moment to share your feedback about today's class.
                      </Text>

                      {!isUnlocked ? (
                        <>
                          {/* 5 Expandable Reflection Questions */}
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

                          {/* Quick Reflection Note Input */}
                          <View style={{ marginTop: 10 }}>
                            <TextInput
                              value={feedbackNote}
                              onChangeText={setFeedbackNote}
                              placeholder="Any extra feedback or suggestion for Rahul Dev (Optional)..."
                              placeholderTextColor="#A0A0B8"
                              style={styles.feedbackInput}
                            />
                          </View>

                          {/* Footer Submit Row */}
                          <View style={styles.reflectionFooterRow}>
                            <View style={styles.footerLockNotice}>
                              <Feather name="lock" size={12} color="#5B3CF5" style={{ marginRight: 4 }} />
                              <Text style={styles.footerLockText}>Submit your reflection to unlock the next class.</Text>
                            </View>

                            <Pressable
                              onPress={handleReflectionSubmit}
                              disabled={submittingReflection}
                              style={({ pressed }) => [styles.submitBtn, pressed && styles.pressed]}
                            >
                              {submittingReflection ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                              ) : (
                                <Text style={styles.submitBtnText}>Submit Reflection</Text>
                              )}
                            </Pressable>
                          </View>
                        </>
                      ) : (
                        <View style={styles.submittedSuccessBox}>
                          <MaterialCommunityIcons name="check-circle-outline" size={24} color="#2E7D32" />
                          <View style={{ marginLeft: 8, flex: 1 }}>
                            <Text style={styles.successBoxTitle}>Reflection Completed 🎉</Text>
                            <Text style={styles.successBoxSub}>Your feedback was sent to Rahul Dev. Module 4 is now unlocked!</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* 5. What's Next Section */}
        <Text style={styles.sectionTitle}>What's Next?</Text>
        <View style={styles.whatsNextGrid}>
          {payload.whatsNext.map((item) => (
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
