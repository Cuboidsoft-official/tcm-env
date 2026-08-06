import { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { scheduleLiveClassLink } from "../api/client";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";

const { width } = Dimensions.get("window");

export default function MentorDashboardScreen({ session, user = {}, onBack, onNavigateActivity }) {
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState("Full Stack Web Dev - Session 1");
  const [classTitle, setClassTitle] = useState("Day 1: Frontend Foundations & React Setup");
  const [classTime, setClassTime] = useState("Today • 10:00 AM – 11:30 AM");
  const [meetingUrl, setMeetingUrl] = useState("https://meet.jit.si/tcm-live-fullstack");

  // Weekly Engagement Activity Chart Data (Mon - Sun)
  const weeklyData = [
    { day: "Mon", percent: 75, hours: "6h" },
    { day: "Tue", percent: 90, hours: "7.5h" },
    { day: "Wed", percent: 65, hours: "5h" },
    { day: "Thu", percent: 100, hours: "8h" },
    { day: "Fri", percent: 85, hours: "7h" },
    { day: "Sat", percent: 95, hours: "7.8h" },
    { day: "Sun", percent: 50, hours: "4h" }
  ];

  // Course List & Day-by-Day Syllabus Sessions
  const courseList = [
    { id: "c1", title: "Full Stack Web Development Masterclass", category: "Web Dev" },
    { id: "c2", title: "NEET Ultimate Crash Course 2026", category: "NEET Prep" },
    { id: "c3", title: "JEE Rank Booster Batch 2026", category: "JEE Prep" },
    { id: "c4", title: "Data Science & AI Masterclass", category: "Data Science" }
  ];

  const syllabusSessionsMap = {
    c1: [
      { dayNum: "Day 1", topic: "Environment Setup & React Core Architecture" },
      { dayNum: "Day 2", topic: "State Architecture, Props & Context API" },
      { dayNum: "Day 3", topic: "Node.js Express REST API & Middleware" },
      { dayNum: "Day 4", topic: "MongoDB Database Models & Aggregation" },
      { dayNum: "Day 5", topic: "Production Cloud Deployment & CI/CD" }
    ],
    c2: [
      { dayNum: "Day 1", topic: "Electromagnetism & Optics MCQ Practice" },
      { dayNum: "Day 2", topic: "Organic Reaction Mechanisms & Concepts" },
      { dayNum: "Day 3", topic: "Genetics, Cell Biology & Human Physiology" },
      { dayNum: "Day 4", topic: "Full Syllabus Mock Test & Paper Discussion" }
    ],
    c3: [
      { dayNum: "Day 1", topic: "Differential Calculus & Vectors" },
      { dayNum: "Day 2", topic: "Rotational Dynamics & Thermodynamics" },
      { dayNum: "Day 3", topic: "Physical Chemistry & Solutions" },
      { dayNum: "Day 4", topic: "JEE Advanced PYQs & Time Management" }
    ],
    c4: [
      { dayNum: "Day 1", topic: "Python Data Analysis & Pandas Basics" },
      { dayNum: "Day 2", topic: "Machine Learning Regressions & Classifiers" },
      { dayNum: "Day 3", topic: "Neural Networks & Deep Learning with PyTorch" },
      { dayNum: "Day 4", topic: "Large Language Models & Gemini API" }
    ]
  };

  const timeSlots = [
    "Today • 10:00 AM – 11:30 AM",
    "Today • 02:00 PM – 03:30 PM",
    "Today • 06:00 PM – 07:30 PM",
    "Today • 08:30 PM – 10:00 PM"
  ];

  const [selectedCourseId, setSelectedCourseId] = useState("c1");
  const [selectedDayTopic, setSelectedDayTopic] = useState(syllabusSessionsMap.c1[0].topic);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(timeSlots[0]);

  const currentCourse = courseList.find((c) => c.id === selectedCourseId) || courseList[0];
  const currentSessions = syllabusSessionsMap[selectedCourseId] || syllabusSessionsMap.c1;

  async function handleBroadcastLink() {
    if (!meetingUrl.trim()) {
      Alert.alert("Missing Link", "Please enter a valid Live Class Meeting Link.");
      return;
    }
    try {
      const token = session?.token;
      if (token) {
        await scheduleLiveClassLink(token, selectedCourseId, {
          topic: selectedDayTopic,
          time: selectedTimeSlot,
          meetingUrl: meetingUrl.trim()
        });
      }
      Alert.alert(
        "Live Class Link Broadcasted!",
        `Course: ${currentCourse.title}\nTopic: ${selectedDayTopic}\nTime: ${selectedTimeSlot}\nLink: ${meetingUrl}\n\nEnrolled students have been notified.`
      );
      setScheduleModalOpen(false);
    } catch (err) {
      Alert.alert("Notice", `Broadcasting live class link: ${meetingUrl}`);
      setScheduleModalOpen(false);
    }
  }

  // Recent Student Activity Feed
  const recentActivities = [
    {
      id: "act1",
      studentName: "Ayush Kumar",
      studentAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
      type: "Reflection",
      badgeBg: "#E8F5E9",
      badgeColor: "#2E7D32",
      title: "Completed Live MERN Class & rated 5/5 Stars",
      time: "10 mins ago"
    },
    {
      id: "act2",
      studentName: "Priya Sharma",
      studentAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
      type: "Session",
      badgeBg: "#EAF5FF",
      badgeColor: "#2F79B9",
      title: "Booked 1-on-1 NEET Physics Guidance Session",
      time: "1 hour ago"
    },
    {
      id: "act3",
      studentName: "Rahul Verma",
      studentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      type: "Enrollment",
      badgeBg: "#F0EDFF",
      badgeColor: "#5B3CF5",
      title: "Enrolled in System Design Architecture 2026",
      time: "3 hours ago"
    }
  ];

  function handleCardPress(activityName, description) {
    if (onNavigateActivity) {
      onNavigateActivity(activityName);
    } else {
      Alert.alert(activityName, `${description}\n\nNavigating to separate ${activityName} page.`);
    }
  }

  return (
    <View style={styles.container}>
      {/* 1. Sleek Modern Header */}
      <View style={styles.topHeader}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color="#181725" />
        </Pressable>

        <Text style={styles.headerTitle}>Dashboard</Text>

        <View style={styles.statusPill}>
          <View style={styles.greenDot} />
          <Text style={styles.statusPillText}>Active Mentor</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ============================================================ */}
        {/* 2. HERO OVERVIEW GRADIENT CARD */}
        {/* ============================================================ */}
        <View style={styles.heroCard}>
          {/* Decorative Background Circles */}
          <View style={styles.heroDecoCircle1} />
          <View style={styles.heroDecoCircle2} />

          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.greetingText}>Welcome back,</Text>
              <Text style={styles.mentorNameText}>{user.name || "Rahul Sharma"}</Text>
            </View>

            <View style={styles.heroBadgeIcon}>
              <MaterialCommunityIcons name="shield-check" size={28} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.earningsWrap}>
            <Text style={styles.earningsLabel}>Monthly Earnings & Salary</Text>
            <Text style={styles.earningsAmount}>₹85,400.00</Text>
          </View>

          <View style={styles.heroBottomRow}>
            <View style={styles.withdrawableBox}>
              <Text style={styles.withdrawableLabel}>Withdrawable Salary</Text>
              <Text style={styles.withdrawableVal}>₹64,000.00</Text>
            </View>

            <Pressable
              onPress={() => handleCardPress("Payouts", "Manage your monthly earnings & bank transfer payouts.")}
              style={styles.payoutNavBtn}
            >
              <Text style={styles.payoutNavBtnText}>Payouts →</Text>
            </Pressable>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 3. KEY PERFORMANCE INDICATORS GRID (4 STAT CARDS) */}
        {/* ============================================================ */}
        <Text style={styles.sectionHeaderTitle}>Key Performance Statistics</Text>

        <View style={styles.kpiGrid}>
          {/* Stat Card 1: Active Courses */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: "#F0EDFF" }]}>
                <MaterialCommunityIcons name="school-outline" size={20} color="#5B3CF5" />
              </View>
              <View style={styles.growthTag}>
                <Text style={styles.growthTagText}>+12%</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>6</Text>
            <Text style={styles.kpiLabel}>Active Courses</Text>
          </View>

          {/* Stat Card 2: 1-on-1 Sessions */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: "#EAF5FF" }]}>
                <Feather name="video" size={18} color="#2F79B9" />
              </View>
              <View style={[styles.growthTag, { backgroundColor: "#EAF5FF" }]}>
                <Text style={[styles.growthTagText, { color: "#2F79B9" }]}>98%</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>48</Text>
            <Text style={styles.kpiLabel}>1-on-1 Calls Done</Text>
          </View>

          {/* Stat Card 3: Total Students */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: "#ECF9E9" }]}>
                <Feather name="users" size={18} color="#2E7D32" />
              </View>
              <View style={[styles.growthTag, { backgroundColor: "#ECF9E9" }]}>
                <Text style={[styles.growthTagText, { color: "#2E7D32" }]}>+45</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>1,420</Text>
            <Text style={styles.kpiLabel}>Enrolled Students</Text>
          </View>

          {/* Stat Card 4: Mentor Rating */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: "#FFF8EC" }]}>
                <FontAwesome name="star" size={17} color="#E7A900" />
              </View>
              <View style={[styles.growthTag, { backgroundColor: "#FFF8EC" }]}>
                <Text style={[styles.growthTagText, { color: "#E7A900" }]}>128 Rev.</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>4.9 ★</Text>
            <Text style={styles.kpiLabel}>Overall Rating</Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 4. WEEKLY ENGAGEMENT CHART VISUALIZER */}
        {/* ============================================================ */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={styles.chartTitle}>Weekly Class Engagement</Text>
              <Text style={styles.chartSub}>Total 41.3 Hours Teaching This Week</Text>
            </View>
            <View style={styles.chartPill}>
              <Text style={styles.chartPillText}>This Week</Text>
            </View>
          </View>

          {/* Bar Chart Visualizer */}
          <View style={styles.barChartContainer}>
            {weeklyData.map((item) => (
              <View key={item.day} style={styles.barCol}>
                <Text style={styles.barValueText}>{item.hours}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${item.percent}%` }]} />
                </View>
                <Text style={styles.barDayLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ============================================================ */}
        {/* 5. QUICK NAVIGATION TOUCH CARDS FOR ACTIVITIES */}
        {/* ============================================================ */}
        <Text style={styles.sectionHeaderTitle}>Activity Center</Text>

        <View style={styles.activityCardsGrid}>
          {/* Activity 1: Add / Manage Courses */}
          <Pressable
            onPress={() => handleCardPress("Add Courses", "Open separate course management page.")}
            style={({ pressed }) => [styles.activityTouchCard, pressed && styles.pressed]}
          >
            <View style={[styles.activityIconBox, { backgroundColor: "#F0EDFF" }]}>
              <MaterialCommunityIcons name="book-open-page-variant" size={22} color="#5B3CF5" />
            </View>

            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>Add & Manage Courses</Text>
              <Text style={styles.activitySub}>6 Active Courses • 1,420 Enrolled</Text>
            </View>

            <View style={styles.arrowCircle}>
              <Feather name="arrow-right" size={16} color="#5B3CF5" />
            </View>
          </Pressable>

          {/* Activity 2: Create Webinar and Events */}
          <Pressable
            onPress={() => handleCardPress("Create Webinar & Events", "Host live webinars, workshops & community events.")}
            style={({ pressed }) => [styles.activityTouchCard, pressed && styles.pressed]}
          >
            <View style={[styles.activityIconBox, { backgroundColor: "#EAF5FF" }]}>
              <Feather name="video" size={20} color="#2F79B9" />
            </View>

            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>Create Webinar and Events</Text>
              <Text style={styles.activitySub}>Host Live Webinars, Workshops & Events</Text>
            </View>

            <View style={[styles.arrowCircle, { backgroundColor: "#EAF5FF" }]}>
              <Feather name="arrow-right" size={16} color="#2F79B9" />
            </View>
          </Pressable>

          {/* Activity 3: Student Reviews & Feedbacks */}
          <Pressable
            onPress={() => handleCardPress("Give Reviews", "Open separate student reviews & feedback page.")}
            style={({ pressed }) => [styles.activityTouchCard, pressed && styles.pressed]}
          >
            <View style={[styles.activityIconBox, { backgroundColor: "#FFF8EC" }]}>
              <FontAwesome name="star" size={20} color="#E7A900" />
            </View>

            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>Student Reviews & Feedbacks</Text>
              <Text style={styles.activitySub}>4.9 ★ Rating • 128 Reviews</Text>
            </View>

            <View style={[styles.arrowCircle, { backgroundColor: "#FFF8EC" }]}>
              <Feather name="arrow-right" size={16} color="#E7A900" />
            </View>
          </Pressable>

          {/* Activity 4: Payouts & Salary */}
          <Pressable
            onPress={() => handleCardPress("Payouts", "Open separate payouts & salary page.")}
            style={({ pressed }) => [styles.activityTouchCard, pressed && styles.pressed]}
          >
            <View style={[styles.activityIconBox, { backgroundColor: "#ECF9E9" }]}>
              <MaterialCommunityIcons name="wallet-outline" size={22} color="#2E7D32" />
            </View>

            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>Payouts & Earnings</Text>
              <Text style={styles.activitySub}>₹64,000 Withdrawable • Transferred in 24h</Text>
            </View>

            <View style={[styles.arrowCircle, { backgroundColor: "#ECF9E9" }]}>
              <Feather name="arrow-right" size={16} color="#2E7D32" />
            </View>
          </Pressable>

          {/* Activity 5: Schedule Daily Live Class Link (Session-Wise) */}
          <Pressable
            onPress={() => setScheduleModalOpen(true)}
            style={({ pressed }) => [styles.activityTouchCard, { borderColor: "#5B3CF5", backgroundColor: "#F0EDFF" }, pressed && styles.pressed]}
          >
            <View style={[styles.activityIconBox, { backgroundColor: "#5B3CF5" }]}>
              <Feather name="video" size={20} color="#FFFFFF" />
            </View>

            <View style={styles.activityCopy}>
              <Text style={[styles.activityTitle, { color: "#5B3CF5" }]}>Schedule Daily Class Links</Text>
              <Text style={styles.activitySub}>Send session-wise live class links to enrolled students</Text>
            </View>

            <View style={[styles.arrowCircle, { backgroundColor: "#5B3CF5" }]}>
              <Feather name="plus" size={16} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>

        {/* MODAL: BOTTOM SHEET FOR SCHEDULING DAILY LIVE CLASS LINK */}
        <Modal visible={scheduleModalOpen} transparent animationType="slide" onRequestClose={() => setScheduleModalOpen(false)}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "flex-end" }} activeOpacity={1} onPress={() => setScheduleModalOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={{ width: "100%", backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: "88%" }}>
              {/* Drag Handle Indicator */}
              <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "#CBD5E1", alignSelf: "center", marginBottom: 14 }} />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A" }}>Schedule Live Class Link</Text>
                  <Text style={{ fontSize: 12, color: "#64748B" }}>Select Course, Syllabus Topic & Broadcast Class Link</Text>
                </View>
                <TouchableOpacity onPress={() => setScheduleModalOpen(false)} style={{ padding: 6, backgroundColor: "#F1F5F9", borderRadius: 20 }}>
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* 1. SELECT COURSE DROPDOWN */}
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6 }}>1. SELECT CREATED COURSE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {courseList.map((course) => {
                    const isSelected = course.id === selectedCourseId;
                    return (
                      <TouchableOpacity
                        key={course.id}
                        onPress={() => {
                          setSelectedCourseId(course.id);
                          const firstTopic = (syllabusSessionsMap[course.id] || [])[0]?.topic || "";
                          setSelectedDayTopic(firstTopic);
                        }}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: isSelected ? "#5B3CF5" : "#F8FAFC",
                          borderWidth: 1,
                          borderColor: isSelected ? "#5B3CF5" : "#E2E8F0",
                          marginRight: 8
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? "#FFFFFF" : "#334155" }}>
                          {course.title}
                        </Text>
                        <Text style={{ fontSize: 10, color: isSelected ? "#DDD6FE" : "#94A3B8", marginTop: 2 }}>
                          Category: {course.category}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* 2. SELECT DAY-BY-DAY SYLLABUS SESSION */}
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6 }}>2. SELECT DAY-BY-DAY SYLLABUS SESSION</Text>
                <View style={{ marginBottom: 16 }}>
                  {currentSessions.map((sess) => {
                    const isSelected = sess.topic === selectedDayTopic;
                    return (
                      <TouchableOpacity
                        key={sess.dayNum}
                        onPress={() => setSelectedDayTopic(sess.topic)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 12,
                          borderRadius: 12,
                          backgroundColor: isSelected ? "#F0EDFF" : "#F8FAFC",
                          borderWidth: 1,
                          borderColor: isSelected ? "#5B3CF5" : "#E2E8F0",
                          marginBottom: 8
                        }}
                      >
                        <View style={{ backgroundColor: isSelected ? "#5B3CF5" : "#E2E8F0", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: isSelected ? "#FFFFFF" : "#64748B" }}>{sess.dayNum}</Text>
                        </View>
                        <Text style={{ flex: 1, fontSize: 13, fontWeight: isSelected ? "700" : "500", color: isSelected ? "#5B3CF5" : "#1E293B" }}>
                          {sess.topic}
                        </Text>
                        {isSelected && <MaterialCommunityIcons name="check-circle" size={18} color="#5B3CF5" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 3. SELECTABLE TIME SLOTS */}
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6 }}>3. SELECT TIME SLOT</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {timeSlots.map((slot) => {
                    const isSelected = slot === selectedTimeSlot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        onPress={() => setSelectedTimeSlot(slot)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: isSelected ? "#5B3CF5" : "#F1F5F9",
                          borderWidth: 1,
                          borderColor: isSelected ? "#5B3CF5" : "#CBD5E1"
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "600", color: isSelected ? "#FFFFFF" : "#334155" }}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 4. LIVE CLASS MEETING URL */}
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569", marginBottom: 6 }}>4. LIVE MEETING LINK (Jitsi / Zoom / Meet)</Text>
                <TextInput
                  value={meetingUrl}
                  onChangeText={setMeetingUrl}
                  style={{ borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 12, padding: 12, fontSize: 13, marginBottom: 20, color: "#0F172A", backgroundColor: "#F8FAFC" }}
                  placeholder="https://meet.jit.si/tcm-live-fullstack"
                />

                <TouchableOpacity
                  onPress={handleBroadcastLink}
                  style={{ backgroundColor: "#5B3CF5", borderRadius: 14, paddingVertical: 15, alignItems: "center", shadowColor: "#5B3CF5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>Broadcast Class Link</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ============================================================ */}
        {/* 6. RECENT STUDENT TIMELINE */}
        {/* ============================================================ */}
        <Text style={styles.sectionHeaderTitle}>Recent Activity Feed</Text>

        <View style={styles.timelineList}>
          {recentActivities.map((act) => (
            <View key={act.id} style={styles.timelineItem}>
              <Image source={{ uri: act.studentAvatar }} style={styles.timelineAvatar} />
              <View style={styles.timelineContent}>
                <View style={styles.timelineTopRow}>
                  <Text style={styles.timelineStudentName}>{act.studentName}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: act.badgeBg }]}>
                    <Text style={[styles.typeBadgeText, { color: act.badgeColor }]}>{act.type}</Text>
                  </View>
                </View>
                <Text style={styles.timelineTitle}>{act.title}</Text>
                <Text style={styles.timelineTime}>{act.time}</Text>
              </View>
            </View>
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12
  },

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EFFF"
  },
  backBtn: {
    padding: 4
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: "#181725"
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECF9E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2E7D32"
  },
  statusPillText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#2E7D32"
  },

  scrollContent: {
    paddingBottom: 110
  },

  // Hero Card
  heroCard: {
    backgroundColor: "#4323D3",
    borderRadius: 24,
    padding: 20,
    marginTop: 4,
    marginBottom: 18,
    position: "relative",
    overflow: "hidden",
    ...shadow.medium
  },
  heroDecoCircle1: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.08)"
  },
  heroDecoCircle2: {
    position: "absolute",
    bottom: -50,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255, 255, 255, 0.05)"
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16
  },
  greetingText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)"
  },
  mentorNameText: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: "#FFFFFF",
    marginTop: 2
  },
  heroBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center"
  },
  earningsWrap: {
    marginBottom: 16
  },
  earningsLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.75)"
  },
  earningsAmount: {
    fontFamily: fonts.bold,
    fontSize: 30,
    color: "#FFFFFF",
    marginTop: 2
  },
  heroBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14
  },
  withdrawableBox: {
    flex: 1
  },
  withdrawableLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)"
  },
  withdrawableVal: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#FFFFFF",
    marginTop: 1
  },
  payoutNavBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10
  },
  payoutNavBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#5B3CF5"
  },

  sectionHeaderTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#181725",
    marginBottom: 10,
    marginTop: 2
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 18
  },
  kpiCard: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  kpiTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  growthTag: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8
  },
  growthTagText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#5B3CF5"
  },
  kpiValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: "#181725"
  },
  kpiLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 2
  },

  // Chart Visualizer
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  chartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  chartTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: "#181725"
  },
  chartSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: "#7C7C9A",
    marginTop: 1
  },
  chartPill: {
    backgroundColor: "#F0EDFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  chartPillText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#5B3CF5"
  },
  barChartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    paddingTop: 10
  },
  barCol: {
    alignItems: "center",
    flex: 1
  },
  barValueText: {
    fontFamily: fonts.medium,
    fontSize: 8,
    color: "#7C7C9A",
    marginBottom: 4
  },
  barTrack: {
    width: 14,
    height: 75,
    backgroundColor: "#F4F1FF",
    borderRadius: 7,
    justifyContent: "flex-end",
    overflow: "hidden"
  },
  barFill: {
    width: "100%",
    backgroundColor: "#5B3CF5",
    borderRadius: 7
  },
  barDayLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: "#55556A",
    marginTop: 6
  },

  // Activity Touch Cards
  activityCardsGrid: {
    gap: 10,
    marginBottom: 18
  },
  activityTouchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  activityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  activityCopy: {
    flex: 1
  },
  activityTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#181725"
  },
  activitySub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#7C7C9A",
    marginTop: 2
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0EDFF",
    alignItems: "center",
    justifyContent: "center"
  },

  // Timeline
  timelineList: {
    gap: 10,
    marginBottom: 10
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F0EFFF",
    ...shadow.soft
  },
  timelineAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10
  },
  timelineContent: {
    flex: 1
  },
  timelineTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  timelineStudentName: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#181725"
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  typeBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9
  },
  timelineTitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: "#55556A",
    marginTop: 2
  },
  timelineTime: {
    fontFamily: fonts.regular,
    fontSize: 9,
    color: "#9A9A9A",
    marginTop: 2
  },
  pressed: {
    opacity: 0.85
  }
});
