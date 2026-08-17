import { useState, useEffect } from "react";
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
import { getMentorCourses, getProfile, scheduleLiveClassLink, createJobPost, getJobPosts, getMentorJobPosts, updateJobPost, updateJobApplicantStatus, deleteJobPost, allocateCourseToStudent, updateCourseSchedule, deleteCourse } from "../api/client";
import MentorReviewsModal from "../components/MentorReviewsModal";
import CreateJobModal from "../components/CreateJobModal";
import JobApplicantsModal from "../components/JobApplicantsModal";
import JobDetailsModal from "../components/JobDetailsModal";
import { colors, shadow } from "../constants/theme";
import { fonts } from "../constants/fonts";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

export default function MentorDashboardScreen({ session, user = {}, onBack, onNavigateActivity, onEditCourse, onSelectUser }) {
  const { theme } = useTheme();
  const [liveApprovedStatus, setLiveApprovedStatus] = useState(null);

  useEffect(() => {
    loadMentorCourses();
    loadJobs();
    refreshLiveProfile();
  }, [session?.token]);

  async function refreshLiveProfile() {
    if (!session?.token) return;
    try {
      const p = await getProfile(session.token);
      if (p) {
        if (p.isApproved !== undefined) setLiveApprovedStatus(Boolean(p.isApproved));
        else if (p.user && p.user.isApproved !== undefined) setLiveApprovedStatus(Boolean(p.user.isApproved));
      }
    } catch (e) {
      // quiet fallback
    }
  }

  // Mentor Account Admin Approval Guard
  const isExplicitlyPending =
    liveApprovedStatus === false ||
    user.isApproved === false ||
    user.status === "pending" ||
    user.approvalStatus === "pending" ||
    session?.user?.isApproved === false ||
    session?.user?.status === "pending";

  const isApproved = Boolean(
    user.role === "admin" ||
    liveApprovedStatus === true ||
    user.isApproved === true ||
    session?.user?.isApproved === true ||
    user.status === "approved" ||
    session?.user?.status === "approved" ||
    !isExplicitlyPending
  );

  function checkApprovalGuard(actionName = "This feature") {
    if (!isApproved) {
      Alert.alert(
        "Account Verification Required",
        `Your mentor profile is currently under review by TCM Administration. ${actionName} will be enabled once your account is verified.`
      );
      return false;
    }
    return true;
  }

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState("Full Stack Web Dev - Session 1");
  const [classTitle, setClassTitle] = useState("Day 1: Frontend Foundations & React Setup");
  const [classTime, setClassTime] = useState("Today • 10:00 AM – 11:30 AM");
  const [meetingUrl, setMeetingUrl] = useState("https://meet.jit.si/tcm-live-fullstack");
  const [createJobModalOpen, setCreateJobModalOpen] = useState(false);
  const [jobPosts, setJobPosts] = useState([]);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState(null);

  // 1. Allocate Course State & Handler
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [studentEmailInput, setStudentEmailInput] = useState("");
  const [selectedCourseForAllocation, setSelectedCourseForAllocation] = useState(null);
  const [allocating, setAllocating] = useState(false);

  async function handleAllocateCourse() {
    if (!checkApprovalGuard("Course allocation")) return;
    if (!studentEmailInput || !studentEmailInput.trim()) {
      Alert.alert("Input Required ⚠️", "Please enter the student's email address or student ID.");
      return;
    }
    const targetCourse = selectedCourseForAllocation || defaultMentorCourses[0];
    setAllocating(true);
    try {
      const res = await allocateCourseToStudent(session?.token, {
        studentEmail: studentEmailInput.trim(),
        courseId: targetCourse.id,
        courseTitle: targetCourse.title,
        coursePrice: targetCourse.price || "₹4,999"
      });
      if (res?.success) {
        Alert.alert("Course Allocated 🎉", res.message || `Granted ${targetCourse.title} to student.`);
        setAllocateModalOpen(false);
        setStudentEmailInput("");
      } else {
        Alert.alert("Allocation Failed", res?.message || "Could not allocate course.");
      }
    } catch (e) {
      Alert.alert("Error", e?.message || "Could not allocate course to student.");
    } finally {
      setAllocating(false);
    }
  }

  // 2. Manage Class Schedule & Date Shift State & Handler
  const [manageScheduleModalOpen, setManageScheduleModalOpen] = useState(false);
  const [selectedCourseForSchedule, setSelectedCourseForSchedule] = useState(null);
  const [courseStatus, setCourseStatus] = useState("Active");
  const [nextClassDate, setNextClassDate] = useState("Tomorrow");
  const [nextClassTime, setNextClassTime] = useState("10:00 AM – 11:30 AM");
  const [scheduleNote, setScheduleNote] = useState("");
  const [updatingSchedule, setUpdatingSchedule] = useState(false);

  function handleShiftDays(days) {
    const today = new Date();
    today.setDate(today.getDate() + days);
    const dateStr = today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    setNextClassDate(dateStr);
    setScheduleNote(`Shifted class by ${days > 0 ? `+${days}` : days} day(s).`);
  }

  async function handleSaveScheduleUpdate() {
    const targetCourse = selectedCourseForSchedule || defaultMentorCourses[0];
    setUpdatingSchedule(true);
    try {
      const res = await updateCourseSchedule(session?.token, targetCourse.id, {
        status: courseStatus,
        nextClassDate,
        nextClassTime,
        scheduleNote
      });
      if (res?.success) {
        Alert.alert("Schedule Updated 📅", `Updated class schedule & status for ${targetCourse.title}. Enrolled students have been notified!`);
        setManageScheduleModalOpen(false);
      } else {
        Alert.alert("Update Failed", res?.message || "Could not update schedule.");
      }
    } catch (e) {
      Alert.alert("Error", e?.message || "Could not update schedule.");
    } finally {
      setUpdatingSchedule(false);
    }
  }

  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(false);

  function promptDeleteCourse(course) {
    if (!checkApprovalGuard("Course deletion")) return;
    if (!course) return;
    setCourseToDelete(course);
  }

  async function confirmDeleteCourseAction() {
    if (!courseToDelete) return;
    const courseId = courseToDelete.id || courseToDelete._id || courseToDelete.customId;
    const courseTitle = courseToDelete.title || "Course";

    setDeletingCourse(true);
    try {
      if (session?.token && courseId) {
        await deleteCourse(session.token, courseId);
      }
      setMentorCourses((prev) => prev.filter((c) => String(c.id || c._id || c.customId) !== String(courseId)));
      Alert.alert("Course Deleted 🎉", `"${courseTitle}" was removed successfully.`);
      setCourseToDelete(null);
    } catch (err) {
      Alert.alert("Error", err?.message || "Could not delete course.");
    } finally {
      setDeletingCourse(false);
    }
  }

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

  const defaultMentorCourses = [
    {
      id: "c1",
      title: "Full Stack Web Development Masterclass",
      category: "Web Development",
      modules: [
        { dayNum: "Day 1", topic: "Environment Setup & React Core Architecture" },
        { dayNum: "Day 2", topic: "State Architecture, Props & Context API" },
        { dayNum: "Day 3", topic: "Node.js Express REST API & Middleware" },
        { dayNum: "Day 4", topic: "MongoDB Database Models & Aggregation" },
        { dayNum: "Day 5", topic: "Production Cloud Deployment & CI/CD" }
      ]
    }
  ];

  const timeSlots = [
    "Today • 10:00 AM – 11:30 AM",
    "Today • 02:00 PM – 03:30 PM",
    "Today • 06:00 PM – 07:30 PM",
    "Today • 08:30 PM – 10:00 PM"
  ];

  const [mentorCourses, setMentorCourses] = useState(defaultMentorCourses);
  const [selectedCourseId, setSelectedCourseId] = useState("c1");
  const [selectedDayTopic, setSelectedDayTopic] = useState(defaultMentorCourses[0].modules[0].topic);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(timeSlots[0]);
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState("Today • 04:30 PM – 06:00 PM");
  const [recordedVideoUrl, setRecordedVideoUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [notesPdfUrl, setNotesPdfUrl] = useState("https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view");

  async function loadJobs() {
    try {
      const data = await getMentorJobPosts(session?.token, user);
      setJobPosts(data || []);
    } catch (e) {}
  }

  async function handleUpdateApplicantStatus(jobId, applicantUserId, newStatus) {
    try {
      const updatedJob = await updateJobApplicantStatus(session?.token, jobId, applicantUserId, newStatus);
      setJobPosts((prev) => prev.map((j) => (j.id === jobId ? updatedJob : j)));
      if (selectedJobForApplicants?.id === jobId) {
        setSelectedJobForApplicants(updatedJob);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update candidate status.");
    }
  }

  async function handleCreateOrUpdateJob(payload, existingId) {
    try {
      if (existingId) {
        const updated = await updateJobPost(session?.token, existingId, payload);
        setJobPosts((prev) => prev.map((j) => (j.id === existingId ? updated : j)));
      } else {
        const newJob = await createJobPost(session?.token, payload);
        setJobPosts((prev) => [newJob, ...prev]);
      }
      setJobToEdit(null);
      await loadJobs();
    } catch (e) {
      Alert.alert("Error", "Failed to save job.");
    }
  }

  async function handleDeleteJob(jobId) {
    const cleanId = String(jobId).replace(/^post-/, "");
    const performDelete = async () => {
      try {
        await deleteJobPost(session?.token, jobId);
        setJobPosts((prev) =>
          prev.filter((j) => {
            const jId = String(j.id || j._id);
            return jId !== String(jobId) && jId !== cleanId;
          })
        );
        Alert.alert("Job Deleted", "The job posting has been deleted.");
        loadJobs();
      } catch (e) {
        Alert.alert("Error", "Failed to delete job.");
      }
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Are you sure you want to remove this job posting?")) {
        performDelete();
      }
      return;
    }

    Alert.alert("Delete Job Post", "Are you sure you want to remove this job posting? It will be permanently removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: performDelete
      }
    ]);
  }

  async function loadMentorCourses() {
    try {
      if (session?.token) {
        const res = await getMentorCourses(session.token);
        if (res && Array.isArray(res.courses) && res.courses.length > 0) {
          setMentorCourses(res.courses);
          setSelectedCourseId(res.courses[0].id);
          setSelectedDayTopic(res.courses[0].modules?.[0]?.topic || `Day 1: ${res.courses[0].title}`);
        }
      }
    } catch (e) {}
  }

  const activeCourseList = mentorCourses.length > 0 ? mentorCourses : defaultMentorCourses;
  const currentCourse = activeCourseList.find((c) => c.id === selectedCourseId) || activeCourseList[0];
  const currentSessions = currentCourse?.modules || defaultMentorCourses[0].modules;

  async function handleBroadcastLink() {
    if (!meetingUrl.trim() && !recordedVideoUrl.trim() && !notesPdfUrl.trim()) {
      Alert.alert("Missing Link", "Please enter a valid Live Class Meeting Link, Recorded Video Link, or PDF Notes Link.");
      return;
    }

    const finalTime = isCustomTime ? customTimeInput : selectedTimeSlot;
    const selectedSess = currentSessions.find(
      (s) => (s.topic || s.title || "").includes(selectedDayTopic) || selectedDayTopic.includes(s.topic || s.title || "")
    );

    try {
      const token = session?.token;
      if (token) {
        await scheduleLiveClassLink(token, selectedCourseId, {
          topic: selectedDayTopic,
          moduleId: selectedSess?.id || selectedSess?._id,
          time: finalTime,
          meetingUrl: meetingUrl.trim(),
          recordedUrl: recordedVideoUrl.trim(),
          notesPdfUrl: notesPdfUrl.trim()
        });
      }
      Alert.alert(
        "Resources Saved",
        `Course: ${currentCourse.title}\nTopic: ${selectedDayTopic}\nLive Link: ${meetingUrl || "N/A"}\nRecorded Video: ${recordedVideoUrl || "N/A"}\nPDF Notes: ${notesPdfUrl || "N/A"}`
      );
      setScheduleModalOpen(false);
    } catch (err) {
      Alert.alert("Notice", `Saved class resources for ${selectedDayTopic}`);
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
      badgeBg: "#E8F5E9",
      badgeColor: "#0A6836",
      title: "Enrolled in System Design Architecture 2026",
      time: "3 hours ago"
    }
  ];

  function handleCardPress(activityName, description) {
    if (!checkApprovalGuard(activityName)) return;
    if (onNavigateActivity) {
      onNavigateActivity(activityName);
    } else {
      Alert.alert(activityName, `${description}\n\nNavigating to separate ${activityName} page.`);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* 1. Sleek Modern Header */}
      <View style={[styles.topHeader, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <Pressable onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Feather name="chevron-left" size={24} color={theme.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Dashboard</Text>

        {isApproved ? (
          <View style={[styles.statusPill, { backgroundColor: theme.isDark ? "#064E3B" : "#ECF9E9", borderColor: theme.border }]}>
            <View style={styles.greenDot} />
            <Text style={[styles.statusPillText, { color: theme.isDark ? "#34D399" : "#2E7D32" }]}>Active Mentor</Text>
          </View>
        ) : (
          <View style={[styles.statusPill, { backgroundColor: theme.isDark ? "#361D00" : "#FFF8E1", borderColor: "#F59E0B" }]}>
            <MaterialCommunityIcons name="shield-clock-outline" size={13} color="#D97706" style={{ marginRight: 4 }} />
            <Text style={[styles.statusPillText, { color: theme.isDark ? "#FBBF24" : "#B45309", fontWeight: "700" }]}>Verification Pending</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ============================================================ */}
        {/* 1. PENDING ADMIN APPROVAL CORPORATE LOCK BANNER */}
        {/* ============================================================ */}
        {!isApproved ? (
          <View style={{
            backgroundColor: theme.isDark ? "#1E1B4B" : "#F0FDF4",
            borderColor: theme.isDark ? "#4338CA" : "#A7F3D0",
            borderWidth: 1.5,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 14,
            ...shadow.soft
          }}>
            <View style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: theme.isDark ? "#312E81" : "#047857",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#047857",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25,
              shadowRadius: 5,
              elevation: 3
            }}>
              <MaterialCommunityIcons name="shield-clock-outline" size={24} color="#FFFFFF" />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <View style={{ backgroundColor: theme.isDark ? "#312E81" : "#D1FAE5", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                  <Text style={{ color: theme.isDark ? "#A5B4FC" : "#047857", fontFamily: fonts.bold, fontSize: 9, letterSpacing: 0.4 }}>
                    VERIFICATION IN PROGRESS
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 13.5, fontFamily: fonts.bold, color: theme.text || colors.ink }}>
                Mentor Account Verification Pending
              </Text>
              <Text style={{ fontSize: 11, fontFamily: fonts.regular, color: theme.subtext || colors.muted, marginTop: 4, lineHeight: 17 }}>
                Your mentor profile is currently under review by TCM Administration. Access to dashboard features—including course publishing, live class scheduling, student management, and payouts—will be automatically unlocked upon approval.
              </Text>
            </View>
          </View>
        ) : null}

        {/* ============================================================ */}
        {/* 2. HERO OVERVIEW GRADIENT CARD */}
        {/* ============================================================ */}
        <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
          {/* Decorative Background Circles */}
          <View style={styles.heroDecoCircle1} />
          <View style={styles.heroDecoCircle2} />

          <View style={styles.heroTopRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: "#FFFFFF" }} />
              ) : (
                <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255, 255, 255, 0.2)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF" }}>
                  <Text style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 18 }}>
                    {(user.name || "M").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View>
                <Text style={styles.greetingText}>Welcome back,</Text>
                <Text style={styles.mentorNameText}>{user.name || "Mentor"}</Text>
              </View>
            </View>

            <View style={styles.heroBadgeIcon}>
              <MaterialCommunityIcons name="shield-check" size={28} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.earningsWrap}>
            <Text style={styles.earningsLabel}>Monthly Earnings & Salary</Text>
            <Text style={styles.earningsAmount}>{user.monthlyRevenue || "₹0.00"}</Text>
          </View>

          <View style={styles.heroBottomRow}>
            <View style={styles.withdrawableBox}>
              <Text style={styles.withdrawableLabel}>Withdrawable Salary</Text>
              <Text style={styles.withdrawableVal}>{user.totalRevenue || "₹0.00"}</Text>
            </View>

            <Pressable
              onPress={() => handleCardPress("Payouts", "Manage your monthly earnings & bank transfer payouts.")}
              style={styles.payoutNavBtn}
            >
              <Text style={[styles.payoutNavBtnText, { color: theme.primary }]}>Payouts →</Text>
            </Pressable>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 3. KEY PERFORMANCE INDICATORS GRID (4 STAT CARDS) */}
        {/* ============================================================ */}
        <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>Key Performance Statistics</Text>

        <View style={styles.kpiGrid}>
          {/* Stat Card 1: Active Courses */}
          <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: theme.badgeBg }]}>
                <MaterialCommunityIcons name="school-outline" size={20} color={theme.primary} />
              </View>
              <View style={[styles.growthTag, { backgroundColor: theme.badgeBg }]}>
                <Text style={[styles.growthTagText, { color: theme.primary }]}>Active</Text>
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: theme.text }]}>{(activeCourseList || []).length}</Text>
            <Text style={[styles.kpiLabel, { color: theme.subtext }]}>Active Courses</Text>
          </View>

          {/* Stat Card 2: 1-on-1 Sessions */}
          <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: theme.badgeBg }]}>
                <Feather name="video" size={18} color={theme.primary} />
              </View>
              <View style={[styles.growthTag, { backgroundColor: theme.badgeBg }]}>
                <Text style={[styles.growthTagText, { color: theme.primary }]}>Calls</Text>
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: theme.text }]}>{user.stats?.callsDone !== undefined ? user.stats.callsDone : (user.callsDone || 0)}</Text>
            <Text style={[styles.kpiLabel, { color: theme.subtext }]}>1-on-1 Calls Done</Text>
          </View>

          {/* Stat Card 3: Total Students */}
          <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: theme.badgeBg }]}>
                <Feather name="users" size={18} color={theme.primary} />
              </View>
              <View style={[styles.growthTag, { backgroundColor: theme.badgeBg }]}>
                <Text style={[styles.growthTagText, { color: theme.primary }]}>Students</Text>
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: theme.text }]}>{user.totalStudentsCount !== undefined ? user.totalStudentsCount : (user.studentsCount || 0)}</Text>
            <Text style={[styles.kpiLabel, { color: theme.subtext }]}>Enrolled Students</Text>
          </View>

          {/* Stat Card 4: Mentor Rating */}
          <View style={[styles.kpiCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: theme.badgeBg }]}>
                <FontAwesome name="star" size={17} color="#E7A900" />
              </View>
              <View style={[styles.growthTag, { backgroundColor: theme.badgeBg }]}>
                <Text style={[styles.growthTagText, { color: "#E7A900" }]}>{user.reviewsCount || "0 Rev."}</Text>
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: theme.text }]}>{user.rating ? `${user.rating} ★` : "5.0 ★"}</Text>
            <Text style={[styles.kpiLabel, { color: theme.subtext }]}>Overall Rating</Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* 4. WEEKLY ENGAGEMENT CHART VISUALIZER */}
        {/* ============================================================ */}
        <View style={[styles.chartCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={[styles.chartTitle, { color: theme.text }]}>Weekly Class Engagement</Text>
              <Text style={[styles.chartSub, { color: theme.subtext }]}>Total 41.3 Hours Teaching This Week</Text>
            </View>
            <View style={[styles.chartPill, { backgroundColor: theme.badgeBg }]}>
              <Text style={[styles.chartPillText, { color: theme.primary }]}>This Week</Text>
            </View>
          </View>

          {/* Bar Chart Visualizer */}
          <View style={styles.barChartContainer}>
            {(weeklyData || []).map((item) => (
              <View key={item.day} style={styles.barCol}>
                <Text style={[styles.barValueText, { color: theme.subtext }]}>{item.hours}</Text>
                <View style={[styles.barTrack, { backgroundColor: theme.isDark ? "#1E263B" : "#F4F1FF" }]}>
                  <View style={[styles.barFill, { height: `${item.percent}%`, backgroundColor: theme.primary }]} />
                </View>
                <Text style={[styles.barDayLabel, { color: theme.subtext }]}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ============================================================ */}
        {/* 5. QUICK NAVIGATION TOUCH CARDS FOR ACTIVITIES */}
        {/* ============================================================ */}
        <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>Activity Center</Text>

        <View style={styles.activityCardsGrid}>
          {/* Activity 1: Add / Manage Courses */}
          <Pressable
            onPress={() => handleCardPress("Add Courses", "Open separate course management page.")}
            style={({ pressed }) => [styles.activityTouchCard, { backgroundColor: theme.cardBg, borderColor: theme.border }, pressed && styles.pressed]}
          >
            <View style={[styles.activityIconBox, { backgroundColor: theme.isDark ? "#1E1B4B" : "#E8F5E9" }]}>
              <MaterialCommunityIcons name="book-open-page-variant" size={22} color={theme.primary} />
            </View>

            <View style={styles.activityCopy}>
              <Text style={[styles.activityTitle, { color: theme.text }]}>Add & Manage Courses</Text>
              <Text style={[styles.activitySub, { color: theme.subtext }]}>6 Active Courses • 1,420 Enrolled</Text>
            </View>

            <View style={[styles.arrowCircle, { backgroundColor: theme.badgeBg }]}>
              <Feather name="arrow-right" size={16} color={theme.primary} />
            </View>
          </Pressable>

          {/* Activity 2: Create Webinar and Events */}
          <Pressable
            onPress={() => handleCardPress("Create Webinar & Events", "Host live webinars, workshops & community events.")}
            style={({ pressed }) => [styles.activityTouchCard, { backgroundColor: theme.cardBg, borderColor: theme.border }, pressed && styles.pressed]}
          >
            <View style={[styles.activityIconBox, { backgroundColor: theme.isDark ? "#1E3A8A" : "#EAF5FF" }]}>
              <Feather name="video" size={20} color={theme.isDark ? "#60A5FA" : "#2F79B9"} />
            </View>

            <View style={styles.activityCopy}>
              <Text style={[styles.activityTitle, { color: theme.text }]}>Create Webinar and Events</Text>
              <Text style={[styles.activitySub, { color: theme.subtext }]}>Host Live Webinars, Workshops & Events</Text>
            </View>

            <View style={[styles.arrowCircle, { backgroundColor: theme.isDark ? "#1E3A8A" : "#EAF5FF" }]}>
              <Feather name="arrow-right" size={16} color={theme.isDark ? "#60A5FA" : "#2F79B9"} />
            </View>
          </Pressable>

          {/* Activity 3: Post a Job / Hiring Drive */}
          <Pressable
            onPress={() => {
              if (!checkApprovalGuard("Job posting")) return;
              setJobToEdit(null);
              setCreateJobModalOpen(true);
            }}
            style={({ pressed }) => [styles.activityTouchCard, { backgroundColor: theme.isDark ? "#1E1B4B" : "#F5F3FF", borderColor: theme.border }, pressed && styles.pressed]}
          >
            <View style={[styles.activityIconBox, { backgroundColor: theme.isDark ? "#312E81" : "#E8F5E9" }]}>
              <Ionicons name="briefcase" size={22} color={theme.primary} />
            </View>

            <View style={styles.activityCopy}>
              <Text style={[styles.activityTitle, { color: theme.primary }]}>Post a Job / Hiring Drive</Text>
              <Text style={[styles.activitySub, { color: theme.subtext }]}>Post Openings & AI Auto-Tracks Candidate Limits</Text>
            </View>

            <View style={[styles.arrowCircle, { backgroundColor: theme.primary }]}>
              <Feather name="plus" size={16} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* Activity 3: Student Reviews & Feedbacks */}
          <Pressable
            onPress={() => {
              if (!checkApprovalGuard("Student reviews")) return;
              setReviewsModalOpen(true);
            }}
            style={({ pressed }) => [styles.activityTouchCard, { backgroundColor: theme.cardBg, borderColor: theme.border }, pressed && styles.pressed]}
          >
            <View style={[styles.activityIconBox, { backgroundColor: theme.isDark ? "#78350F" : "#FFF8EC" }]}>
              <FontAwesome name="star" size={20} color="#E7A900" />
            </View>

            <View style={styles.activityCopy}>
              <Text style={[styles.activityTitle, { color: theme.text }]}>Student Reviews & Feedbacks</Text>
              <Text style={[styles.activitySub, { color: theme.subtext }]}>View & Write Class Student Reviews</Text>
            </View>

            <View style={[styles.arrowCircle, { backgroundColor: "#FFF8EC" }]}>
              <Feather name="arrow-right" size={16} color="#E7A900" />
            </View>
          </Pressable>

          {/* Activity 4: Payouts & Salary */}
          <Pressable
            onPress={() => handleCardPress("Payouts", "Open separate payouts & salary page.")}
            style={({ pressed }) => [styles.activityTouchCard, { backgroundColor: theme.cardBg, borderColor: theme.border }, pressed && styles.pressed]}
          >
            <View style={[styles.activityIconBox, { backgroundColor: theme.badgeBg }]}>
              <MaterialCommunityIcons name="wallet-outline" size={22} color={theme.primary} />
            </View>

            <View style={styles.activityCopy}>
              <Text style={[styles.activityTitle, { color: theme.text }]}>Payouts & Earnings</Text>
              <Text style={[styles.activitySub, { color: theme.subtext }]}>{user.totalRevenue || "₹0.00"} Withdrawable • Transferred in 24h</Text>
            </View>

            <View style={[styles.arrowCircle, { backgroundColor: theme.badgeBg }]}>
              <Feather name="arrow-right" size={16} color={theme.primary} />
            </View>
          </Pressable>

          {/* Activity 5: Schedule Daily Live Class Link (Session-Wise) */}
          <Pressable
            onPress={() => {
              if (!checkApprovalGuard("Live class scheduling")) return;
              setScheduleModalOpen(true);
            }}
            style={({ pressed }) => [styles.activityTouchCard, { borderColor: theme.primary, backgroundColor: theme.isDark ? "#1E1B4B" : "#F0EDFF" }, pressed && styles.pressed]}
          >
            <View style={[styles.activityIconBox, { backgroundColor: theme.primary }]}>
              <Feather name="video" size={20} color="#FFFFFF" />
            </View>

            <View style={styles.activityCopy}>
              <Text style={[styles.activityTitle, { color: theme.primary }]}>Schedule Daily Class Links</Text>
              <Text style={[styles.activitySub, { color: theme.subtext }]}>Send session-wise live class links to enrolled students</Text>
            </View>

            <View style={[styles.arrowCircle, { backgroundColor: theme.primary }]}>
              <Feather name="plus" size={16} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* Activity 6: Allocate Course to Student (Admin / Mentor) */}
          <Pressable
            onPress={() => {
              if (!checkApprovalGuard("Course allocation")) return;
              setAllocateModalOpen(true);
            }}
            style={({ pressed }) => [styles.activityTouchCard, { borderColor: "#10B981", backgroundColor: theme.isDark ? "#064E3B" : "#ECFDF5" }, pressed && styles.pressed]}
          >
            <View style={[styles.activityIconBox, { backgroundColor: "#10B981" }]}>
              <Feather name="user-check" size={20} color="#FFFFFF" />
            </View>

            <View style={styles.activityCopy}>
              <Text style={[styles.activityTitle, { color: "#10B981" }]}>Allocate Course to Student</Text>
              <Text style={[styles.activitySub, { color: theme.subtext }]}>Grant direct course access to any student email or ID</Text>
            </View>

            <View style={[styles.arrowCircle, { backgroundColor: "#10B981" }]}>
              <Feather name="arrow-right" size={16} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>

        {/* ============================================================ */}
        {/* ALL CREATED COURSES & EDIT OPTIONS */}
        {/* ============================================================ */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>My Created Courses ({activeCourseList.length})</Text>
          <TouchableOpacity
            onPress={() => {
              if (!checkApprovalGuard("Course creation")) return;
              if (onNavigateActivity) onNavigateActivity("Add Courses");
            }}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Feather name="plus-circle" size={15} color={theme.primary} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.primary }}>Create New</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 16 }}>
          {(activeCourseList || []).map((course, idx) => (
            <View
              key={course.id || idx}
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.border,
                ...shadow.sm
              }}
            >
              {/* Top Row: Category Badge & Duration */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <View style={{ backgroundColor: theme.badgeBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: theme.primary }}>{course.category || "TCM Information Tech"}</Text>
                </View>
                <View style={{ backgroundColor: theme.isDark ? "#1E263B" : "#F1F5F9", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, fontFamily: fonts.medium, color: theme.subtext }}>{course.duration || "20 Days"}</Text>
                </View>
              </View>

              {/* Title & Metadata (Full Width) */}
              <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: theme.text, lineHeight: 22, marginBottom: 4 }}>{course.title}</Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: theme.subtext, marginBottom: 14 }}>
                {course.modules?.length || 5} Day-by-Day Syllabus Modules • {course.studentsEnrolled || 0} Enrolled Students
              </Text>

              {/* Action Buttons Row */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border }}>
                {/* MANAGE SCHEDULE & SHIFT DATES BUTTON */}
                <TouchableOpacity
                  onPress={() => {
                    if (!checkApprovalGuard("Schedule management")) return;
                    setSelectedCourseForSchedule(course);
                    setCourseStatus(course.status || "Active");
                    setNextClassDate(course.nextClassDate || "Tomorrow");
                    setNextClassTime(course.nextClassTime || "10:00 AM – 11:30 AM");
                    setManageScheduleModalOpen(true);
                  }}
                  style={{
                    backgroundColor: theme.isDark ? "#1E1B4B" : "#F0EDFF",
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.primary,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5
                  }}
                >
                  <Feather name="calendar" size={13} color={theme.primary} />
                  <Text style={{ fontSize: 11.5, fontFamily: fonts.bold, color: theme.primary }}>Schedule</Text>
                </TouchableOpacity>

                {/* EDIT COURSE BUTTON */}
                <TouchableOpacity
                  onPress={() => {
                    if (!checkApprovalGuard("Course editing")) return;
                    if (onEditCourse) {
                      onEditCourse(course);
                    } else if (onNavigateActivity) {
                      onNavigateActivity("Add Courses");
                    } else {
                      Alert.alert("Edit Course", `Opening edit editor for "${course.title}".`);
                    }
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: theme.badgeBg,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.border
                  }}
                >
                  <Feather name="edit-3" size={13} color={theme.primary} />
                  <Text style={{ fontSize: 11.5, fontFamily: fonts.bold, color: theme.primary }}>Edit</Text>
                </TouchableOpacity>

                {/* DELETE COURSE BUTTON */}
                <TouchableOpacity
                  onPress={() => promptDeleteCourse(course)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: theme.isDark ? "#3B1419" : "#FEE2E2",
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.isDark ? "#991B1B" : "#FCA5A5"
                  }}
                >
                  <Feather name="trash-2" size={13} color="#EF4444" />
                  <Text style={{ fontSize: 11.5, fontFamily: fonts.bold, color: "#EF4444" }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* MODAL: BOTTOM SHEET FOR SCHEDULING DAILY LIVE CLASS LINK */}
        <Modal visible={scheduleModalOpen} transparent animationType="slide" onRequestClose={() => setScheduleModalOpen(false)}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "flex-end" }} activeOpacity={1} onPress={() => setScheduleModalOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={{ width: "100%", backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: "88%" }}>
              {/* Drag Handle Indicator */}
              <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "#CBD5E1", alignSelf: "center", marginBottom: 14 }} />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text }}>Schedule Live Class Link</Text>
                  <Text style={{ fontSize: 12, color: theme.subtext }}>Select Course, Syllabus Topic & Broadcast Class Link</Text>
                </View>
                <TouchableOpacity onPress={() => setScheduleModalOpen(false)} style={{ padding: 6, backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9", borderRadius: 20 }}>
                  <Feather name="x" size={18} color={theme.subtext} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* 1. SELECT CREATED COURSE */}
                <Text style={{ fontSize: 12, fontWeight: "700", color: theme.text, marginBottom: 6 }}>1. SELECT YOUR CREATED COURSE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {activeCourseList.map((course) => {
                    const isSelected = course.id === selectedCourseId;
                    return (
                      <TouchableOpacity
                        key={course.id}
                        onPress={() => {
                          setSelectedCourseId(course.id);
                          const firstTopic = (course.modules || [])[0]?.topic || `Day 1: ${course.title}`;
                          setSelectedDayTopic(firstTopic);
                        }}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 12,
                          backgroundColor: isSelected ? theme.primary : theme.badgeBg,
                          borderWidth: 1,
                          borderColor: isSelected ? theme.primary : theme.border,
                          marginRight: 8
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? "#FFFFFF" : theme.primary }}>
                          {course.title}
                        </Text>
                        <Text style={{ fontSize: 10, color: isSelected ? "#E2E8F0" : theme.subtext, marginTop: 2 }}>
                          Category: {course.category || "TCM Academy"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* 2. SELECT DAY-BY-DAY SYLLABUS SESSION */}
                <Text style={{ fontSize: 12, fontWeight: "700", color: theme.text, marginBottom: 6 }}>2. SELECT DAY-BY-DAY SYLLABUS SESSION</Text>
                <View style={{ marginBottom: 16 }}>
                  {currentSessions.map((sess, idx) => {
                    const topicText = sess.topic || sess.title || `Module ${idx + 1}`;
                    const isSelected = topicText === selectedDayTopic;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setSelectedDayTopic(topicText)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 12,
                          borderRadius: 12,
                          backgroundColor: isSelected ? theme.badgeBg : (theme.isDark ? "#1E293B" : "#F8FAFC"),
                          borderWidth: 1,
                          borderColor: isSelected ? theme.primary : theme.border,
                          marginBottom: 8
                        }}
                      >
                        <View style={{ backgroundColor: isSelected ? theme.primary : theme.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: isSelected ? "#FFFFFF" : theme.subtext }}>{sess.dayNum || `Day ${idx + 1}`}</Text>
                        </View>
                        <Text style={{ flex: 1, fontSize: 13, fontWeight: isSelected ? "700" : "500", color: isSelected ? theme.primary : theme.text }}>
                          {topicText}
                        </Text>
                        {isSelected && <MaterialCommunityIcons name="check-circle" size={18} color={theme.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 3. SELECTABLE TIME SLOTS & CUSTOM TIME PICKER */}
                <Text style={{ fontSize: 12, fontWeight: "700", color: theme.text, marginBottom: 6 }}>3. SELECT TIME SLOT OR CUSTOM TIME</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {timeSlots.map((slot) => {
                    const isSelected = !isCustomTime && slot === selectedTimeSlot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        onPress={() => {
                          setIsCustomTime(false);
                          setSelectedTimeSlot(slot);
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: isSelected ? theme.primary : theme.badgeBg,
                          borderWidth: 1,
                          borderColor: isSelected ? theme.primary : theme.border
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "600", color: isSelected ? "#FFFFFF" : theme.primary }}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    onPress={() => setIsCustomTime(true)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: isCustomTime ? theme.primary : theme.badgeBg,
                      borderWidth: 1,
                      borderColor: isCustomTime ? theme.primary : theme.border
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: isCustomTime ? "#FFFFFF" : theme.primary }}>
                      + Custom Time Slot
                    </Text>
                  </TouchableOpacity>
                </View>

                {isCustomTime && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: theme.primary, marginBottom: 4 }}>Enter Custom Class Schedule Time:</Text>
                    <TextInput
                      value={customTimeInput}
                      onChangeText={setCustomTimeInput}
                      style={{ borderWidth: 1, borderColor: theme.primary, borderRadius: 10, padding: 10, fontSize: 13, color: theme.text, backgroundColor: theme.badgeBg }}
                      placeholder="e.g. Today • 04:30 PM – 06:00 PM"
                      placeholderTextColor={theme.subtext}
                    />
                  </View>
                )}

                {/* 4. LIVE CLASS MEETING URL */}
                <Text style={{ fontSize: 12, fontWeight: "700", color: theme.text, marginBottom: 6 }}>4. LIVE MEETING LINK (Jitsi / Zoom / Meet)</Text>
                <TextInput
                  value={meetingUrl}
                  onChangeText={setMeetingUrl}
                  style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, fontSize: 13, marginBottom: 16, color: theme.text, backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC" }}
                  placeholder="https://meet.jit.si/tcm-live-fullstack"
                  placeholderTextColor={theme.subtext}
                />

                {/* 5. RECORDED CLASS VIDEO URL */}
                <Text style={{ fontSize: 12, fontWeight: "700", color: theme.text, marginBottom: 6 }}>5. RECORDED CLASS VIDEO LINK (YouTube / Drive / MP4)</Text>
                <TextInput
                  value={recordedVideoUrl}
                  onChangeText={setRecordedVideoUrl}
                  style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, fontSize: 13, marginBottom: 16, color: theme.text, backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC" }}
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  placeholderTextColor={theme.subtext}
                />

                {/* 6. OFFICIAL CLASS NOTES PDF DOCUMENT LINK */}
                <Text style={{ fontSize: 12, fontWeight: "700", color: theme.text, marginBottom: 6 }}>6. OFFICIAL CLASS NOTES PDF LINK (Upload / Google Drive PDF)</Text>
                <TextInput
                  value={notesPdfUrl}
                  onChangeText={setNotesPdfUrl}
                  style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, fontSize: 13, marginBottom: 20, color: theme.text, backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC" }}
                  placeholder="https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view"
                  placeholderTextColor={theme.subtext}
                />

                <TouchableOpacity
                  onPress={handleBroadcastLink}
                  style={{ backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 15, alignItems: "center", shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, flexDirection: "row", justifyContent: "center" }}
                >
                  <Feather name="send" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>Save & Broadcast Resources</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <MentorReviewsModal
          visible={reviewsModalOpen}
          session={session}
          courses={activeCourseList}
          onClose={() => setReviewsModalOpen(false)}
          onOpenUserProfile={(u) => {
            setReviewsModalOpen(false);
            if (onSelectUser) onSelectUser(u);
          }}
        />

        {/* ============================================================ */}
        {/* MY POSTED JOBS & APPLICANT RESUMES SECTION */}
        {/* ============================================================ */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="briefcase" size={18} color={theme.primary} />
            <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: theme.text }}>My Posted Jobs & Hiring Drives</Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              setJobToEdit(null);
              setCreateJobModalOpen(true);
            }}
            activeOpacity={0.8}
            style={{ backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 11.5, fontFamily: fonts.bold }}>+ Post Job</Text>
          </TouchableOpacity>
        </View>

        {jobPosts.length === 0 ? (
          <View style={{ backgroundColor: theme.cardBg, borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 20, alignItems: "center", marginBottom: 20 }}>
            <Ionicons name="briefcase-outline" size={32} color={theme.subtext} />
            <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: theme.text, marginTop: 8 }}>No Jobs Posted Yet</Text>
            <Text style={{ fontSize: 11.5, color: theme.subtext, textAlign: "center", marginTop: 2 }}>
              Post job openings to receive candidate applications & resumes directly on your dashboard.
            </Text>
            <TouchableOpacity
              onPress={() => setCreateJobModalOpen(true)}
              style={{ backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginTop: 12 }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: fonts.bold }}>+ Create First Job Posting</Text>
            </TouchableOpacity>
          </View>
        ) : (
          jobPosts.map((job) => {
            const isFilled = job.status === "filled" || Number(job.selectedCandidates || 0) >= Number(job.requiredCandidates || 1);
            const selectedCount = job.selectedCandidates || (job.applicants || []).filter((a) => a.status === "selected").length;
            const reqCount = job.requiredCandidates || 1;
            const fillPercent = Math.min(100, Math.round((selectedCount / reqCount) * 100));

            return (
              <View
                key={job.id}
                style={{
                  backgroundColor: theme.cardBg,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.border,
                  padding: 14,
                  marginBottom: 12
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontSize: 14.5, fontFamily: fonts.bold, color: theme.text }}>{job.title}</Text>
                    <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>
                      ₹{job.minSalary} – ₹{job.maxSalary} {job.salaryPeriod} • Deadline: {job.deadline}
                    </Text>
                  </View>

                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: isFilled ? "#FEE2E2" : theme.badgeBg }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: isFilled ? "#991B1B" : theme.primary }}>
                      {isFilled ? "FILLED" : "ACTIVE"}
                    </Text>
                  </View>
                </View>

                {/* AI Candidate Progress Tracker */}
                <View style={{ marginTop: 10, backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC", padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 10.5, fontFamily: fonts.bold, color: theme.subtext }}>AI Candidate Limit Tracker</Text>
                    <Text style={{ fontSize: 10.5, fontWeight: "700", color: theme.primary }}>{selectedCount} / {reqCount} Candidates Selected</Text>
                  </View>
                  <View style={{ height: 5, width: "100%", backgroundColor: theme.border, borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${fillPercent}%`, backgroundColor: isFilled ? "#EF4444" : theme.primary, borderRadius: 3 }} />
                  </View>
                </View>

                {/* Action Buttons: View Resumes, Edit, Delete */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.border }}>
                  <TouchableOpacity
                    onPress={() => setSelectedJobForApplicants(job)}
                    activeOpacity={0.8}
                    style={{ backgroundColor: theme.badgeBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: "row", alignItems: "center" }}
                  >
                    <Ionicons name="people" size={13} color={theme.primary} style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11.5, fontFamily: fonts.bold, color: theme.primary }}>
                      View Applicants & Resumes ({job.applicants?.length || 0})
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setJobToEdit(job);
                        setCreateJobModalOpen(true);
                      }}
                      style={{ padding: 6, borderRadius: 6, backgroundColor: "#F1F5F9" }}
                    >
                      <Feather name="edit-2" size={13} color="#475569" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteJob(job.id)}
                      style={{ padding: 6, borderRadius: 6, backgroundColor: "#FEE2E2" }}
                    >
                      <Feather name="trash-2" size={13} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* ============================================================ */}
        {/* 6. RECENT STUDENT TIMELINE */}
        {/* ============================================================ */}
        <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>Recent Activity Feed</Text>

        <View style={styles.timelineList}>
          {recentActivities.map((act) => (
            <View key={act.id} style={[styles.timelineItem, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <Image source={{ uri: act.studentAvatar }} style={styles.timelineAvatar} />
              <View style={styles.timelineContent}>
                <View style={styles.timelineTopRow}>
                  <Text style={[styles.timelineStudentName, { color: theme.text }]}>{act.studentName}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: theme.isDark ? "#1E293B" : act.badgeBg }]}>
                    <Text style={[styles.typeBadgeText, { color: act.badgeColor }]}>{act.type}</Text>
                  </View>
                </View>
                <Text style={[styles.timelineTitle, { color: theme.subtext }]}>{act.title}</Text>
                <Text style={[styles.timelineTime, { color: theme.subtext }]}>{act.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      {/* MODAL: MENTOR JOB POSTING / EDIT */}
      <CreateJobModal
        visible={createJobModalOpen}
        user={user}
        token={session?.token}
        jobToEdit={jobToEdit}
        onClose={() => {
          setCreateJobModalOpen(false);
          setJobToEdit(null);
        }}
        onSubmitJob={handleCreateOrUpdateJob}
      />

      {/* MODAL: MENTOR APPLICANTS & RESUMES VIEW */}
      <JobApplicantsModal
        visible={Boolean(selectedJobForApplicants)}
        job={selectedJobForApplicants}
        onClose={() => setSelectedJobForApplicants(null)}
        onUpdateApplicantStatus={handleUpdateApplicantStatus}
        onOpenUserProfile={(u) => {
          setSelectedJobForApplicants(null);
          if (onSelectUser) onSelectUser(u);
        }}
      />

      {/* MODAL 1: ALLOCATE COURSE TO STUDENT */}
      <Modal visible={allocateModalOpen} transparent animationType="slide" onRequestClose={() => setAllocateModalOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "center", padding: 20 }} activeOpacity={1} onPress={() => setAllocateModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={{ width: "100%", backgroundColor: theme.cardBg, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="user-check" size={20} color="#10B981" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: theme.text }}>Allocate Course to Student 🎓</Text>
                  <Text style={{ fontSize: 11, color: theme.subtext }}>Grant direct course enrollment access</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setAllocateModalOpen(false)}>
                <Feather name="x" size={20} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.text, marginBottom: 6 }}>1. Student Email or Student ID</Text>
            <TextInput
              value={studentEmailInput}
              onChangeText={setStudentEmailInput}
              placeholder="e.g. student@gmail.com or usr_123"
              placeholderTextColor={theme.subtext}
              style={{
                backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC",
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 10,
                padding: 11,
                fontSize: 13,
                color: theme.text,
                marginBottom: 14
              }}
            />

            <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.text, marginBottom: 6 }}>2. Select Course to Allocate</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
              {(activeCourseList || defaultMentorCourses).map((c) => {
                const isSel = (selectedCourseForAllocation?.id || defaultMentorCourses[0].id) === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setSelectedCourseForAllocation(c)}
                    style={{
                      backgroundColor: isSel ? theme.primary : theme.badgeBg,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isSel ? theme.primary : theme.border
                    }}
                  >
                    <Text style={{ fontSize: 11.5, fontFamily: fonts.bold, color: isSel ? "#FFFFFF" : theme.primary }}>
                      {c.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={handleAllocateCourse}
              disabled={allocating}
              style={{
                backgroundColor: "#10B981",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
                opacity: allocating ? 0.7 : 1,
                marginTop: 4
              }}
            >
              <Text style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 14 }}>
                {allocating ? "Allocating Access..." : "Grant Course Access Now 🎉"}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL 2: MANAGE CLASS SCHEDULE & SHIFT DATES (Class Aage/Piche) */}
      <Modal visible={manageScheduleModalOpen} transparent animationType="slide" onRequestClose={() => setManageScheduleModalOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "center", padding: 20 }} activeOpacity={1} onPress={() => setManageScheduleModalOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={{ width: "100%", backgroundColor: theme.cardBg, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.badgeBg, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="calendar" size={20} color={theme.primary} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontFamily: fonts.bold, color: theme.text }}>Class Schedule & Date Shift 📅</Text>
                  <Text style={{ fontSize: 11, color: theme.subtext }}>{selectedCourseForSchedule?.title || "Course Schedule"}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setManageScheduleModalOpen(false)}>
                <Feather name="x" size={20} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.text, marginBottom: 6 }}>1. Course Status</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              {["Active", "Rescheduled", "Upcoming", "Completed"].map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => setCourseStatus(st)}
                  style={{
                    backgroundColor: courseStatus === st ? theme.primary : theme.badgeBg,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: courseStatus === st ? theme.primary : theme.border
                  }}
                >
                  <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: courseStatus === st ? "#FFFFFF" : theme.primary }}>
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.text, marginBottom: 6 }}>2. Quick Date Shift (Class Aage / Piche)</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              {[
                { label: "+1 Day", days: 1 },
                { label: "+2 Days", days: 2 },
                { label: "-1 Day", days: -1 },
                { label: "-2 Days", days: -2 }
              ].map((shift) => (
                <TouchableOpacity
                  key={shift.label}
                  onPress={() => handleShiftDays(shift.days)}
                  style={{
                    backgroundColor: theme.isDark ? "#334155" : "#F1F5F9",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.border
                  }}
                >
                  <Text style={{ fontSize: 11.5, fontFamily: fonts.bold, color: theme.text }}>
                    {shift.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.text, marginBottom: 6 }}>3. Next Class Date & Time</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              <TextInput
                value={nextClassDate}
                onChangeText={setNextClassDate}
                placeholder="Date (e.g. Tomorrow, Mon 18 Aug)"
                placeholderTextColor={theme.subtext}
                style={{
                  flex: 1,
                  backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC",
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 12,
                  color: theme.text
                }}
              />
              <TextInput
                value={nextClassTime}
                onChangeText={setNextClassTime}
                placeholder="Time (e.g. 10:00 AM)"
                placeholderTextColor={theme.subtext}
                style={{
                  flex: 1,
                  backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC",
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 10,
                  padding: 10,
                  fontSize: 12,
                  color: theme.text
                }}
              />
            </View>

            <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: theme.text, marginBottom: 6 }}>4. Schedule Note for Enrolled Students</Text>
            <TextInput
              value={scheduleNote}
              onChangeText={setScheduleNote}
              placeholder="e.g. Live session shifted due to holiday / mentor update."
              placeholderTextColor={theme.subtext}
              style={{
                backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC",
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 10,
                padding: 10,
                fontSize: 12,
                color: theme.text,
                marginBottom: 14
              }}
            />

            <TouchableOpacity
              onPress={handleSaveScheduleUpdate}
              disabled={updatingSchedule}
              style={{
                backgroundColor: theme.primary,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
                opacity: updatingSchedule ? 0.7 : 1
              }}
            >
              <Text style={{ color: "#FFFFFF", fontFamily: fonts.bold, fontSize: 14 }}>
                {updatingSchedule ? "Saving Schedule..." : "Save & Notify Enrolled Students 📢"}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: DELETE COURSE CUSTOM CONFIRMATION */}
      <Modal visible={Boolean(courseToDelete)} transparent animationType="fade" onRequestClose={() => setCourseToDelete(null)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "center", alignItems: "center", padding: 20 }} activeOpacity={1} onPress={() => setCourseToDelete(null)}>
          <TouchableOpacity activeOpacity={1} style={{ width: "90%", maxWidth: 400, backgroundColor: theme.cardBg, borderRadius: 22, padding: 22, alignItems: "center", borderWidth: 1, borderColor: theme.border }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Feather name="trash-2" size={28} color="#EF4444" />
            </View>
            <Text style={{ fontSize: 17, fontFamily: fonts.bold, color: theme.text, textAlign: "center", marginBottom: 8 }}>Delete Course Permanently?</Text>
            <Text style={{ fontSize: 13, fontFamily: fonts.regular, color: theme.subtext, textAlign: "center", lineHeight: 19, marginBottom: 20 }}>
              Are you sure you want to delete "{courseToDelete?.title}"? All modules, lessons, and enrollment data will be permanently removed.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              <TouchableOpacity onPress={() => setCourseToDelete(null)} style={{ flex: 1, backgroundColor: theme.isDark ? "#1E263B" : "#F1F5F9", paddingVertical: 12, borderRadius: 12, alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: theme.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDeleteCourseAction} disabled={deletingCourse} style={{ flex: 1, backgroundColor: "#EF4444", paddingVertical: 12, borderRadius: 12, alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: "#FFFFFF" }}>{deletingCourse ? "Deleting..." : "Delete Course"}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL: JOB DETAILS VIEW */}
      <JobDetailsModal
        visible={Boolean(selectedJobForDetails)}
        job={selectedJobForDetails}
        isMentor={true}
        onClose={() => setSelectedJobForDetails(null)}
      />
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
    color: "#0A6836"
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
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8
  },
  growthTagText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#0A6836"
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
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  chartPillText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "#0A6836"
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
    backgroundColor: "#0A6836",
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
    backgroundColor: "#E8F5E9",
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
